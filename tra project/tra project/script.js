const API_URL = "http://localhost:3000/students";

let students = [];

function setStatus(message, isError = false) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = isError ? "error" : "success";
}

function getErrorMessage(error, fallback) {
    return error.response?.data?.message || error.response?.data?.error || fallback;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));
}

function nextStudentId() {
    const highestId = students.reduce((highest, student) => {
        const match = String(student.studentId || student.id).match(/^VUCSE(\d+)$/i);
        return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);

    return `VUCSE${String(highestId + 1).padStart(3, "0")}`;
}

// Load all students
async function loadStudents() {

    try {

        const response = await axios.get(API_URL);

        students = response.data;

        displayStudents();

    } catch (error) {

        setStatus(getErrorMessage(error, "Unable to load students. Start JSON Server and try again."), true);

    }

}


// Display students
function displayStudents() {

    const table = document.getElementById("studentTable");

    table.innerHTML = "";

    const searchText = document
        .getElementById("search")
        .value
        .toLowerCase();

    const courseText = document
        .getElementById("courseFilter")
        .value
        .toLowerCase();

    const filteredStudents = students.filter(student => {

        const nameMatch = String(student.name || "")
            .toLowerCase()
            .includes(searchText);

        const courseMatch = String(student.course || "")
            .toLowerCase()
            .includes(courseText);

        return nameMatch && courseMatch;

    });

    filteredStudents.forEach(student => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${escapeHtml(student.studentId || student.id)}</td>

            <td>${escapeHtml(student.name)}</td>

            <td>${escapeHtml(student.email)}</td>

            <td>${escapeHtml(student.phone)}</td>

            <td>${escapeHtml(student.age)}</td>

            <td>${escapeHtml(student.course)}</td>

            <td>${escapeHtml(student.city)}</td>

            <td>

                <button type="button" class="view-button" data-action="view" data-id="${escapeHtml(student.id)}">
                    View
                </button>

                <button type="button" class="edit-button" data-action="edit" data-id="${escapeHtml(student.id)}">
                    Edit
                </button>

                <button type="button" class="delete-button" data-action="delete" data-id="${escapeHtml(student.id)}">
                    Delete
                </button>

            </td>

        `;

        table.appendChild(row);

    });

}

document.getElementById("studentTable").addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "view") viewStudent(id);
    if (button.dataset.action === "edit") editStudent(id);
    if (button.dataset.action === "delete") deleteStudent(id);
});


// Add or Update student
document.getElementById("studentForm").addEventListener("submit", async function(event) {

    event.preventDefault();

    const form = event.currentTarget;
    const id = document.getElementById("studentId").value;

    if (!form.checkValidity()) {
        form.reportValidity();
        setStatus("Please correct the highlighted fields.", true);
        return;
    }

    const phone = document.getElementById("phone").value.trim();

    if (!/^[0-9+() -]{7,20}$/.test(phone)) {
        setStatus("Phone must contain 7 to 20 valid characters.", true);
        document.getElementById("phone").focus();
        return;
    }

    const student = {

        studentId: id === "" ? nextStudentId() : (students.find(student => String(student.id) === id)?.studentId || nextStudentId()),

        name: document.getElementById("name").value.trim(),

        email: document.getElementById("email").value.trim(),

        phone,

        age: Number(document.getElementById("age").value),

        course: document.getElementById("course").value.trim(),

        city: document.getElementById("city").value.trim()

    };

    try {

        if (id === "") {

            // CREATE
            await axios.post(API_URL, student);

            setStatus("Student added successfully.");

        } else {

            // UPDATE
            await axios.put(API_URL + "/" + encodeURIComponent(id), student);

            setStatus("Student updated successfully.");

        }

        clearForm();

        await loadStudents();

    } catch (error) {

        setStatus(getErrorMessage(error, "Error saving student."), true);

    }

});


// Edit student
function editStudent(id) {

    const student = students.find(s => s.id == id);

    if (!student) {
        setStatus("Student not found.", true);
        return;
    }

    document.getElementById("studentId").value = student.id;

    document.getElementById("name").value = student.name;

    document.getElementById("email").value = student.email;

    document.getElementById("phone").value = student.phone;

    document.getElementById("age").value = student.age;

    document.getElementById("course").value = student.course;

    document.getElementById("city").value = student.city;

    document.getElementById("submitBtn").innerText = "Update Student";
    setStatus(`Editing ${student.studentId || student.id}. Change the details and select Update Student.`);

}


// Delete student
async function deleteStudent(id) {

    if (!confirm("Are you sure you want to delete?")) return;

    try {

        await axios.delete(API_URL + "/" + id);

        setStatus("Student deleted successfully.");

        await loadStudents();

    } catch (error) {

        setStatus(getErrorMessage(error, "Error deleting student."), true);

    }

}


// View student details
function viewStudent(id) {

    const student = students.find(s => s.id == id);

    if (!student) {
        setStatus("Student not found.", true);
        return;
    }

    alert(

        "Student Details\n\n" +

        "ID: " + (student.studentId || student.id) + "\n" +

        "Name: " + student.name + "\n" +

        "Email: " + student.email + "\n" +

        "Phone: " + student.phone + "\n" +

        "Age: " + student.age + "\n" +

        "Course: " + student.course + "\n" +

        "City: " + student.city

    );

}


// Clear form
function clearForm() {

    document.getElementById("studentForm").reset();

    document.getElementById("studentId").value = "";

    document.getElementById("submitBtn").innerText = "Add Student";

}


// Load students when page opens
loadStudents();
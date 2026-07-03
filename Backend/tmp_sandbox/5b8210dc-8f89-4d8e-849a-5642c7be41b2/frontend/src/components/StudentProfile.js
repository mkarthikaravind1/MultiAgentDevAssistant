import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentProfile = () => {
    const [student, setStudent] = useState({});
    const [id, setId] = useState(1);

    useEffect(() => {
        axios.get(`http://localhost:8080/api/students/${id}`)
            .then(response => {
                setStudent(response.data);
            })
            .catch(error => {
                console.error(error);
            });
    }, [id]);

    return (
        <div>
            <h1>Student Profile</h1>
            <p>Name: {student.name}</p>
            <p>Grade: {student.grade}</p>
        </div>
    );
};

export default StudentProfile;
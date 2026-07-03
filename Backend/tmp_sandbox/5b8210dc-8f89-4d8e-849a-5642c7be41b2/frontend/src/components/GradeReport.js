import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GradeReport = () => {
    const [grades, setGrades] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8080/api/grades')
            .then(response => {
                setGrades(response.data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    return (
        <div>
            <h1>Grade Report</h1>
            <ul>
                {grades.map((grade) => (
                    <li key={grade.id}>{grade.studentName}: {grade.grade}</li>
                ))}
            </ul>
        </div>
    );
};

export default GradeReport;
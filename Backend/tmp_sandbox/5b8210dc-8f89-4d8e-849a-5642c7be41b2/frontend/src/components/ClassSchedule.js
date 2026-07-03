import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassSchedule = () => {
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8080/api/classes')
            .then(response => {
                setClasses(response.data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    return (
        <div>
            <h1>Class Schedule</h1>
            <ul>
                {classes.map((cls) => (
                    <li key={cls.id}>{cls.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default ClassSchedule;
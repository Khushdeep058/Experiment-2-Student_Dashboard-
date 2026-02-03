let allStudents = [];
let studyGroup = [];
let filteredStudents = [];
let overallChart = null;
let groupChart = null;

document.getElementById('fileInput').addEventListener('change', loadData);

function loadData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                allStudents = data.students || data;
                filteredStudents = [...allStudents];
                displayStudents();
                updateCharts();
                generateInsights();
            } catch (error) {
                alert('Error loading file. Please check the format.');
            }
        };
        reader.readAsText(file);
    }
}

function displayStudents() {
    const container = document.getElementById('studentRows');
    container.innerHTML = '';
    
    if (filteredStudents.length === 0) {
        container.innerHTML = '<div class="no-data">No students to display</div>';
        return;
    }
    
    filteredStudents.forEach(student => {
        const average = calculateAverage(student);
        const isInGroup = studyGroup.some(s => s.id === student.id);
        
        let performanceClass = '';
        if (average > 85) performanceClass = 'performance-high';
        else if (average >= 70) performanceClass = 'performance-medium';
        else performanceClass = 'performance-low';
        
        const row = document.createElement('div');
        row.className = `student-row ${performanceClass}`;
        row.innerHTML = `
            <span>${student.name}</span>
            <span>${student.math}</span>
            <span>${student.science}</span>
            <span>${student.english}</span>
            <span>${average.toFixed(1)}</span>
            <button class="add-btn" onclick="addToGroup(${student.id})" ${isInGroup ? 'disabled' : ''}>
                ${isInGroup ? 'Added' : 'Add'}
            </button>
        `;
        container.appendChild(row);
    });
}

function calculateAverage(student) {
    return (student.math + student.science + student.english) / 3;
}

function searchStudents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredStudents = allStudents.filter(student => 
        student.name.toLowerCase().includes(searchTerm)
    );
    displayStudents();
}

function filterByPerformance() {
    const filterValue = document.getElementById('filterSelect').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredStudents = allStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm);
        const avg = calculateAverage(student);
        
        if (filterValue === 'all') return matchesSearch;
        if (filterValue === 'high') return matchesSearch && avg > 85;
        if (filterValue === 'medium') return matchesSearch && avg >= 70 && avg <= 85;
        if (filterValue === 'low') return matchesSearch && avg < 70;
        
        return matchesSearch;
    });
    
    displayStudents();
}

function addToGroup(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (student && !studyGroup.some(s => s.id === studentId)) {
        studyGroup.push(student);
        displayStudents();
        updateGroupDisplay();
        updateCharts();
        generateInsights();
    }
}

function removeFromGroup(studentId) {
    studyGroup = studyGroup.filter(s => s.id !== studentId);
    displayStudents();
    updateGroupDisplay();
    updateCharts();
    generateInsights();
}

function updateGroupDisplay() {
    const groupList = document.getElementById('groupList');
    const totalStudents = document.getElementById('totalStudents');
    const groupAverage = document.getElementById('groupAverage');
    const topPerformer = document.getElementById('topPerformer');
    
    totalStudents.textContent = studyGroup.length;
    
    if (studyGroup.length === 0) {
        groupAverage.textContent = '0';
        topPerformer.textContent = '-';
        groupList.innerHTML = '<div class="no-data">No students in study group</div>';
        return;
    }
    
    const totalAvg = studyGroup.reduce((sum, student) => sum + calculateAverage(student), 0);
    groupAverage.textContent = (totalAvg / studyGroup.length).toFixed(1);
    
    const bestStudent = studyGroup.reduce((best, current) => {
        return calculateAverage(current) > calculateAverage(best) ? current : best;
    });
    topPerformer.textContent = `${bestStudent.name} (${calculateAverage(bestStudent).toFixed(1)})`;
    
    groupList.innerHTML = '';
    studyGroup.forEach(student => {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.innerHTML = `
            <span>${student.name} (${calculateAverage(student).toFixed(1)})</span>
            <button class="remove-btn" onclick="removeFromGroup(${student.id})">Remove</button>
        `;
        groupList.appendChild(item);
    });
}

function clearGroup() {
    studyGroup = [];
    displayStudents();
    updateGroupDisplay();
    updateCharts();
    generateInsights();
}

function updateCharts() {
    if (allStudents.length === 0) return;
    
    updateOverallChart();
    updateGroupChart();
}

function updateOverallChart() {
    const ctx = document.getElementById('overallChart');
    
    const mathScores = allStudents.map(s => s.math);
    const scienceScores = allStudents.map(s => s.science);
    const englishScores = allStudents.map(s => s.english);
    
    const mathAvg = mathScores.reduce((a,b) => a+b, 0) / mathScores.length;
    const scienceAvg = scienceScores.reduce((a,b) => a+b, 0) / scienceScores.length;
    const englishAvg = englishScores.reduce((a,b) => a+b, 0) / englishScores.length;
    
    if (overallChart) {
        overallChart.destroy();
    }
    
    overallChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Math', 'Science', 'English'],
            datasets: [{
                label: 'Average Score',
                data: [mathAvg, scienceAvg, englishAvg],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(155, 89, 182, 0.7)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(155, 89, 182, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateGroupChart() {
    const ctx = document.getElementById('groupChart');
    
    if (groupChart) {
        groupChart.destroy();
    }
    
    if (studyGroup.length === 0) {
        groupChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['rgba(200, 200, 200, 0.5)']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        return;
    }
    
    const mathAvg = studyGroup.reduce((sum, s) => sum + s.math, 0) / studyGroup.length;
    const scienceAvg = studyGroup.reduce((sum, s) => sum + s.science, 0) / studyGroup.length;
    const englishAvg = studyGroup.reduce((sum, s) => sum + s.english, 0) / studyGroup.length;
    
    groupChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Math', 'Science', 'English'],
            datasets: [{
                label: 'Subject Distribution',
                data: [mathAvg, scienceAvg, englishAvg],
                backgroundColor: [
                    'rgba(52, 152, 219, 0.7)',
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(155, 89, 182, 0.7)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(155, 89, 182, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function generateInsights() {
    const container = document.getElementById('insightsContent');
    
    if (allStudents.length === 0) {
        container.innerHTML = '<p>Load student data to see insights</p>';
        return;
    }
    
    container.innerHTML = '';
    
    const allAverages = allStudents.map(s => calculateAverage(s));
    const classAverage = allAverages.reduce((a,b) => a+b, 0) / allAverages.length;
    
    const highPerformers = allStudents.filter(s => calculateAverage(s) > 85).length;
    const needSupport = allStudents.filter(s => calculateAverage(s) < 70).length;
    
    const mathScores = allStudents.map(s => s.math);
    const scienceScores = allStudents.map(s => s.science);
    const englishScores = allStudents.map(s => s.english);
    
    const mathAvg = mathScores.reduce((a,b) => a+b, 0) / mathScores.length;
    const scienceAvg = scienceScores.reduce((a,b) => a+b, 0) / scienceScores.length;
    const englishAvg = englishScores.reduce((a,b) => a+b, 0) / englishScores.length;
    
    let weakestSubject = 'Math';
    let lowestAvg = mathAvg;
    if (scienceAvg < lowestAvg) {
        weakestSubject = 'Science';
        lowestAvg = scienceAvg;
    }
    if (englishAvg < lowestAvg) {
        weakestSubject = 'English';
    }
    
    let strongestSubject = 'Math';
    let highestAvg = mathAvg;
    if (scienceAvg > highestAvg) {
        strongestSubject = 'Science';
        highestAvg = scienceAvg;
    }
    if (englishAvg > highestAvg) {
        strongestSubject = 'English';
    }
    
    const insight1 = document.createElement('div');
    insight1.className = 'insight-item';
    insight1.innerHTML = `<strong>Class Performance:</strong> Overall average is ${classAverage.toFixed(1)}. ${highPerformers} students performing above 85, while ${needSupport} students need additional support.`;
    container.appendChild(insight1);
    
    const insight2 = document.createElement('div');
    insight2.className = 'insight-item';
    insight2.innerHTML = `<strong>Subject Analysis:</strong> ${strongestSubject} is the strongest subject (avg: ${highestAvg.toFixed(1)}). ${weakestSubject} needs more focus (avg: ${lowestAvg.toFixed(1)}).`;
    container.appendChild(insight2);
    
    if (studyGroup.length > 0) {
        const groupAvgs = studyGroup.map(s => calculateAverage(s));
        const groupAverage = groupAvgs.reduce((a,b) => a+b, 0) / groupAvgs.length;
        const diff = groupAverage - classAverage;
        
        const insight3 = document.createElement('div');
        insight3.className = 'insight-item';
        if (diff > 0) {
            insight3.innerHTML = `<strong>Study Group:</strong> Your study group is performing ${diff.toFixed(1)} points above class average. Great selection!`;
        } else {
            insight3.innerHTML = `<strong>Study Group:</strong> Your study group could benefit from adding higher performers to raise the average.`;
        }
        container.appendChild(insight3);
    }
    
    const topStudent = allStudents.reduce((best, current) => {
        return calculateAverage(current) > calculateAverage(best) ? current : best;
    });
    
    const insight4 = document.createElement('div');
    insight4.className = 'insight-item';
    insight4.innerHTML = `<strong>Top Performer:</strong> ${topStudent.name} leads with an average of ${calculateAverage(topStudent).toFixed(1)}.`;
    container.appendChild(insight4);
}

function exportGroup() {
    if (studyGroup.length === 0) {
        alert('No students in study group to export');
        return;
    }
    
    const exportData = {
        exportDate: new Date().toLocaleDateString(),
        studyGroup: studyGroup.map(s => ({
            name: s.name,
            math: s.math,
            science: s.science,
            english: s.english,
            average: calculateAverage(s).toFixed(1)
        })),
        groupStats: {
            totalStudents: studyGroup.length,
            averageScore: (studyGroup.reduce((sum, s) => sum + calculateAverage(s), 0) / studyGroup.length).toFixed(1)
        }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-group-export.json';
    a.click();
    URL.revokeObjectURL(url);
}

window.onload = function() {
    const sampleData = [
        {id: 1, name: "Khush deep", math: 85, science: 78, english: 82},
        {id: 2, name: "Deepali", math: 92, science: 88, english: 90},
        {id: 3, name: "Yashika", math: 76, science: 82, english: 79},
        {id: 4, name: "Lakshay", math: 88, science: 85, english: 87},
        {id: 5, name: "Abhi", math: 72, science: 75, english: 78},
        {id: 6, name: "Akhil", math: 95, science: 92, english: 94},
        {id: 7, name: "Dilji", math: 68, science: 71, english: 73},
        {id: 8, name: "Jenny", math: 84, science: 87, english: 85},
        {id: 9, name: "Prabh", math: 79, science: 76, english: 81},
        
    ];
    
    allStudents = sampleData;
    filteredStudents = [...allStudents];
    displayStudents();
    updateGroupDisplay();
    updateCharts();
    generateInsights();
};
const express = require('express')
const mysql = require('mysql2')
const app = express()
const MongoClient = require('mongodb').MongoClient
const bodyParser = require('body-parser')

// Add the body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }))

//Connect to the mysql DB
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'proj2022',
})

//Home screen
app.get('/', (req, res) => {
    res.send(
        '<p>' +
        '<a href="/employees">View Employees</a>' +
        '<br>' +
        '<a href="/departments">View Departments</a>' +
        '<br>' +
        '<a href="/employeesMongoDB">View Employees (MongoDB)</a>' +
        '</p>',
    )
})


//Display all the emplyee data
app.get('/employees', (req, res) => {
    // Query the database for the employee data
    connection.query('SELECT * FROM employee', (err, results) => {
        if (err) throw err

        // Build the HTML table
        let html = '<h1>List of employees</h1>'
        html += '<table>'
        html += '<tr>'
        html += '<th>EID</th>'
        html += '<th>NAME</th>'
        html += '<th>ROLE</th>'
        html += '<th>SALARY</th>'
        html += '<th>UPDATE</th>'
        html += '</tr>'

        // Add a row for each employee
        results.forEach((employee) => {
            html += '<tr>'
            html += '<td>' + employee.eid + '</td>'
            html += '<td>' + employee.ename + '</td>'
            html += '<td>' + employee.role + '</td>'
            html += '<td>' + employee.salary + '</td>'
            html +=
                '<td><a href="/employees/edit/' + employee.eid + '">Update</a></td>'
            html += '</tr>'
        })

        html += '</table>'

        html += '</table>'
        html += '<br>'
        html += '<a href="/">Back to home page</a>'

        res.send(html)
    })
})

//Edit a selected employee with a specific id
app.get('/employees/edit/:eid', (req, res) => {
    // Get the employee ID 
    const eid = req.params.eid

    // Query the database for the employee data
    connection.query(
        'SELECT * FROM employee WHERE eid = ?',
        [eid],
        (err, results) => {
            if (err) throw err

            // Get the employee data
            const employee = results[0]

            // Build the HTML form
            let html = '<h1>Update Employee</h1>'
            html += '<form action="/employees/update/' + eid + '" method="POST">'
            html += '<label for="name">Name:</label><br>'
            html +=
                '<input type="text" id="name" name="name" value="' +
                employee.ename +
                '"><br>'
            html += '<label for="role">Role:</label><br>'
            html +=
                '<input type="text" id="role" name="role" value="' +
                employee.role +
                '"><br>'
            html += '<label for="salary">Salary:</label><br>'
            html +=
                '<input type="text" id="salary" name="salary" value="' +
                employee.salary +
                '"><br><br>'
            html += '<input type="submit" value="Submit">'
            html += '</form>'

            res.send(html)
        },
    )
})

//Change employee details
app.post('/employees/update/:eid', (req, res) => {
    const eid = req.params.eid

    // Get the updated employee data 
    const employee = req.body

    //Allow the employee to be updated assuiming criteria is met
    let errors = []
    if (employee.name.length < 5) {
        errors.push('Name must be at least 5 characters')
    }
    if (employee.role !== 'Manager' && employee.role !== 'Employee') {
        errors.push('Role must be either Manager or Employee')
    }
    if (employee.salary <= 0) {
        errors.push('Salary must be greater than 0')
    }

    // If there are  errors show an error message
    if (errors.length > 0) {
        res.send('<h1>Error:</h1><br>' + errors.join('<br>'))
    } else {
        // If there are no  errors update the employee data in the database
        connection.query(
            'UPDATE employee SET ename = ?, role = ?, salary = ? WHERE eid = ?',
            [employee.name, employee.role, employee.salary, eid],
            (err, results) => {
                if (err) throw err

                // Redirect the user to the /employees page
                res.redirect('/employees')
            },
        )
    }
})

app.get('/departments', (req, res) => {
    // Query the database for the department data
    connection.query('SELECT * FROM dept', (err, results) => {
        if (err) throw err

        let html = '<h1>List of departments</h1>'
        html += '<table>'
        html += '<tr>'
        html += '<th>ID</th>'
        html += '<th>NAME</th>'
        html += '<th>BUDGET</th>'
        html += '<th>COUNTY</th>'
        html += '<th>DELETE</th>'
        html += '</tr>'

        // Add a row for each department
        results.forEach((department) => {
            html += '<tr>'
            html += '<td>' + department.did + '</td>'
            html += '<td>' + department.dname + '</td>'
            html += '<td>' + department.budget + '</td>'
            html += '<td>' + department.lid + '</td>'
            html +=
                '<td><a href="/departments/delete/' +
                department.did +
                '">Delete</a></td>'
            html += '</tr>'
        })

        html += '</table>'
        html += '<br>'
        html += '<a href="/">Back to home page</a>'
    
        res.send(html)
    })
})

app.get('/departments/delete/:did', (req, res) => {
    // Get the  ID from the form
    const did = req.params.did

    // Check if the department has any associated employees
    connection.query(
        'SELECT * FROM emp_dept WHERE did = ?',
        [did],
        (err, results) => {
            if (err) throw err

            // If the department has no associated employees delete it from the database
            if (results.length === 0) {
                connection.query(
                    'DELETE FROM dept WHERE did = ?',
                    [did],
                    (err, results) => {
                        if (err) throw err

                        // Redirect  to the departments page
                        res.redirect('/departments')
                    },
                )
            } else {
                // show an error message if an employee is associated with a dept
                res.send(
                    '<h1>Error: Cannot delete department with associated employees</h1>',
                )
            }
        },
    )
})
////////////////////////////////////////////////////////////////////////////////////
//                                    Mongo                                       //

// Connect to the MongoDB database // Localhost can also be used however 0.0.0.0 would only work on my pc for some reason
MongoClient.connect('mongodb://0.0.0.0:27017/', console.log("Connected"), (err, client) => {
    if (err) {
        console.error(err)
        return
    }

    // Get a reference to the employees collection in the database
    const collection = client.db('employeesDB').collection('employees')

// Set up the MongoEmployees get
app.get('/employeesMongoDB', (req, res) => {
    // Query the database for all employees
    collection.find({}).toArray((err, employees) => {
      if (err) {       
        console.error(err);
        res.status(500).send({ error: 'Error querying database' });
      } else {
        //return a with all the employee details
        let html = '<h1>Mongo Employees</h1>';
        html += '<a href="/employeesMongoDB/add">Add Employee</a>';
        html += '<table>';
        html += '<tr>';
        html += '<th>EID</th>';
        html += '<th>PHONE</th>';
        html += '<th>EMAIL</th>';
        html += '<th>DELETE</th>';
        html += '</tr>';
  
        // Add a row for each employee
        employees.forEach((employee) => {
          html += '<tr>';
          html += '<td>' + employee._id + '</td>';
          html += '<td>' + employee.phone + '</td>';
          html += '<td>' + employee.email + '</td>';
          html += '<td><a href="/employeesMongoDB/delete?id=' + employee._id + '">Delete</a></td>';
          html += '</tr>';
        });
  
        html += '</table>';
        html += '<br>';
        html += '<a href="/">Back to home page</a>';
        res.send(html);
      }
    });
  });
  
})
//Show the employee add form
app.get('/employeesMongoDB/add', (req, res) => {
    let html = '<h1>Add Employee (MongoDB) </h1>'
    html += 'EID must be at least 4 characters <br>'
    html += 'Phone must be at least 5 characters<br>'
    html += 'A valid email must be entered <br><br>'
    html += '<form action="/employeesMongoDB/add/submit" method="POST"> EID: <input type="text" value="E"  name="_id" required><br>'
    html += 'Phone: <input type="text" name="phone" pattern="[0-9]{5,}" required><br>'
    html += 'Email: <input type="email" name="email" required><br><input type="submit" value="Add" ></form>'
    html += '<br><a href="/">Home</a>'
    res.send(html)
})
//Post for the form
app.post('/employeesMongoDB/add/submit', (req, res) => {
    MongoClient.connect(
        'mongodb://0.0.0.0:27017//employeesDB',
        (err, client) => {
            const db = client.db('employeesDB')
            const collection = client.db('employeesDB').collection('employees')
            const ID = req.body

            let errors = []

            // Get the id from the request body
            const enteredID = req.body._id

            // Use the id to create a SQL query that selects all rows
            // from the table where the id matches the entered id
            const sql = `SELECT * FROM employee WHERE eid = ?`

            // Execute the SQL query and handle the result
            connection.query(sql, [enteredID], (err, result) => {
                if (err) throw err

                if (req.body._id.length < 4) {
                    errors.push('EID must be at least 4 characters')
                }
                //Check if id exists in mySql db
                if (result.length == 0) {
                    errors.push('This ID doesnt exist in the MySql database')
                }
                collection.findOne({ _id: enteredID }, (err, result) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    // Throw error if id already exists
                    if (result) {
                        errors.push('ID already exists in the database')
                    } else {
                        //Matching Id was not found
                    }
                    //Display the errors if any were found
                    if (errors.length > 0) {
                        res.send('<h1>Error:</h1><br>' + errors.join('<br>'))
                    } else {
                        //If there are no errors add the employee to the collection
                        db.collection('employees').insertOne({
                            _id: req.body._id,
                            phone: req.body.phone,
                            email: req.body.email,
                        })
                        res.redirect('/employeesMongoDB')
                    }
                },
                )
            })
        })
})

//Delete an employee from the database
app.get('/employeesMongoDB/delete', (req, res) => {
    // Get the id of the employee to delete from the query string
    const employeeID = req.query.id

    MongoClient.connect('mongodb://0.0.0.0:27017/', (err, client) => {
      if (err) {
        console.error(err)
        res.status(500).send({ error: 'Error connecting to the database' })
        return
      }
      const collection = client.db('employeesDB').collection('employees')
  
      // Use the deleteOne method to remove the employee 
      collection.deleteOne({ _id: employeeID }, (err, result) => {
        if (err) {
          console.error(err)
          res.status(500).send({ error: 'Error deleting employee' })
        } else {
          res.redirect('/employeesMongoDB')
        }
      })
    })
  })
  


app.listen(3000)

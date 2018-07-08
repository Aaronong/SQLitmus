# SQLitmus: A Simple and Practical Tool for SQL Database Performance Testing



## Author's note

I worked on SQLitmus as part of my senior thesis at Yale-NUS College. This README hosts an older version of the SQLitmus project, and consists only of the abstract and feature introduction.

 For the updated full report written in latex, see the PDF file [here](https://github.com/Aaronong/SQLitmus/blob/master/sqlitmus%20report/main.pdf).

## Installation

```{bash}
git clone https://github.com/Aaronong/SQLitmus
cd SQLitmus
yarn install
```



## Abstract

This paper presents SQLitmus, a simple and practical tool for SQL database per- formance testing. SQLitmus was developed to help developers of small-to-mid sized projects conduct quick litmus tests of their SQL databases’s performance. With minimal configurations, SQLitmus populates a test database with large volumes of realistic and Schema-compliant test data, and runs randomized queries against the database to analyze its performance. The graphical interface also offers a data plotting and filtering tool to help developers visualize their performance test results. 

SQLitmus is compatible with Windows, MacOSX, and Linux machines and sup- ports MySQL, PostgreSQL, and MariaDB databases. 

The pilot study was conducted to test SQLitmus against three databases: MySQL, PostgreSQL, and MariaDB. All of these databases are systems provisioned by Amazon Web Service’s Relational Database Service (AWS RDS). 

The results demonstrates that SQLitmus is capable of generating repeatable and reliable performance analyses of SQL databases. The software recorded clear trends of SQL databases slowing down as their size (amount of data stored) and workload (number of concurrent connections) increased. 

Results also revealed performance discrepancies across databases running on identical hardware, data-set, and queries. This shows that SQLitmus can provide developers with intelligence to decide between replaceable databases, queries, and data storage options (e.g., time-stamp vs. date object). 



## 3. SQLitmus Features



### 3.1 Database Connection Management

![3.1png](./sqlitmus%20report/3-1.png)

SQLitmus's landing page offers a way for developers to manage and persist their database connection configurations. Developers are able to add a new set of connection settings, or update their existing set of connection settings. The database management dashboard was forked off the open-source tool SQLectron which already provided a user-friendly GUI for database connection management. Beyond persisting database connection settings, SQLectron does not support any further types of persistence.

To afford developers an additional layer of convenience, SQLitmus persists all available configurations discussed in later sections on a database level. This prevents configurations made for a particular database to spillover into other databases even when they belong to the same server.

### 3.2 Data Generation

![3.2.1.png](./sqlitmus%20report/3-2.png)

Upon connecting to a specified database, SQLitmus populates the the GUI with the full list of tables and fields present on the database (excluding system databases). Field types are also auto-populated.

#### 3.2.1 Configuring field constraints

![3.2.1.png](./sqlitmus%20report/3-2-1.png)

SQLitmus supports six different forms of field constraints: Index Key, Primary Key, Nullable, Foreign Key, Unique Key, and Sorted constraints.

By decluttering the GUI, and offering simple mechanisms by which developers are able to specify their constraints (through switches and selection inputs), SQLitmus offers a configuration experience that surpasses those of its counterparts. Throughout the field constraint configuration process, developers are not required to key in any text or numerical inputs. This achieves a twofold purpose: simplify the configuration process, and eliminate the risk of misconfiguration altogether. 



![3.2.1b.png](./sqlitmus%20report/3-2-1b.png)

As developers specify upstream constraints, invalid downstream configurations are disabled.

This behavior is observed in figure 4 where configuring an index field disables developers from specifying other invalid downstream configurations. The rationale is as follows - index fields necessarily cannot be foreign keys, or nullable fields. It is also taken for granted that index fields are unique and sorted.

SQLitmus also limits developers from specifying configurations that are disallowed by databases (eg. specifying an index key on a non-integer field), considered anti-patterns in the developer community (eg. using timestamps as primary or foreign keys), or breaks referential integrity (eg. selecting a non index, primary, or unique key as a foreign key target). 

![3.2.1c.png](./sqlitmus%20report/3-2-1c.png)

For unsupported data types, SQLitmus allows developers to configure the field type according to one of the six supported types: integer, character, numeric, boolean, time, json. For all downstream configurations, SQLitmus will treat the unsupported type as the type configured by the developer.

As users configure SQLitmus, the GUI provides clear visual feedback to developers to aid them in their configuration efforts. As demonstrated in figures 3 and 4, field constraints appear as tags next to their relevant fields and foreign key constraints appear as tags next to their relevant tables. 

![3.2.1d.png](./sqlitmus%20report/3-2-1d.png)

Developers are also able to view a diagram of their schema to quickly identify misconfigured foreign key relations.

#### 3.2.2 Configuring Data Generators

While data generators can be configured at any point of the configuration process, the author recommend that data generator configurations are performed after field constraints configurations. This allows for a smoother configuration process as some data generators may be invalidated by changes in field constraints.

![3.2.2](./sqlitmus%20report/3-2-2.png)

In SQLitmus, index and foreign key fields are automatically generated. It is complex to resolve referential constraints, especially for cases where a composite primary key is composed of multiple simple and composite foreign keys. Thus, such concerns are abstracted away from developers.

![3.2.2b](./sqlitmus%20report/3-2-2b.png)

In the case where a nullable field is specified, SQLitmus offers an additional null rate generator that is compatible with all of SQLitmus's 23 built-in and 5 custom data generators. Developers simply has to specify a null rate on top of their chosen data generator.

![3.2.2c](./sqlitmus%20report/3-2-2c.png)

Each data generator comes with its own set of configurations which developers are able to access through clicking on the configure button next to the data generator. Some validation rules are common to all generators of a given type (eg. Numerical generators all allow developers to specify min, max, precision, and scale). SQLitmus also ensures that improper validation rules do not affect the integrity of the generated data (eg. positive scales for integer fields are always considered to be zero). These validation rules allow developers to generate data that is compatible with the most stringent database settings.

![3.2.2](./sqlitmus%20report/3-2-2d.png)

Upon successful configuration, developers are able to generate data samples from their customized generator to ensure specification adherance.

### 3.3 Query Generation

Whereas data generation sets the database up with a valid dataset to prepare it for performance testing. Query execution is where performance testing actually occurs. SQLitmus employs the most objective method of performance analysis available: measuring and recording a query's response time.

The query generation feature presented by SQLitmus substantially improves the developer's user experience in configuring test queries. Instead of requiring that developers input an exhaustive list of valid queries, SQLitmus allows developers to specify the types of queries they wish to test their database with. SQLitmus then generates hundreds of randomized valid queries to test the database with for each specified query type. To achieve this end, SQLitmus offers query templating, and a GUI for developers to test the validity of their query templates.

The value of query generation is as follows:

- It is far less rigourous for developers to design a query template as opposed to designing a large set of possible queries to test their database with.
- Performance analysis using a static list of queries yields low quality performance data. Databases cache query results, thus identical queries when ran multiple times against the same database, will measure the speed the database takes to deliver a pre-loaded response from its cache rather than the actual time a database takes to process the query.
- Since the set of generators used to populate the database is identical to the set of generators used to populate the queries, developers are guaranteed to generate valid queries and benefit from the high likelihood of their queries targetting actual data in the database.

#### 3.3.1 Query Templating

Developers are often more interested in finding out the performance of a type of query as compared to the performance of an actual specific query. Developers also do not wish to relearn a new Domain Specific Language to specify their types of queries, and wish to test the exact queries executed in production.

Query templates afford developers the ability to generate multiple queries from a single template . 

```mysql
-- WorksFor targets the index of another row in the Employees table and
-- specifies a supervisor-subordinate relationship
SELECT * FROM Employees WHERE WorksFor=${Employees.RANDROW};
```

The above code snippet for instance demonstrates how a simple query template in SQLitmus allows developers to test for their database's ability to retrieve all subordinates of a randomized Employee. Compare this to having the developers specify a static list of queries.

```mysql
SELECT * FROM Employees WHERE WorksFor=1;
SELECT * FROM Employees WHERE WorksFor=2304;
SELECT * FROM Employees WHERE WorksFor=3520392;
```

Not only is templating much more convenient, it also has a low learning curve. The template above also guarantees that the substituted value belongs to the same domain as the data generated in the WorksFor column.

Expressions nested between a dollar sign and curly braces `${expression}` are parsed by the query pre-processor and replaced by an appropriate value.

In the above case, SQLitmus will replace the expression with a randomly generated row index from the Employees table. 

Beyond generating substitution rules, SQLitmus's query templates affords developers with the ability to setup their queries (to ensure that an actual workload is being measured) and perform clean-ups (to ensure that INSERT or DELETE queries do not cause a substantial cardinality drift) through the use of special delimiters.

```mysql
-- Insert new employee (MySQL)
-- Values are (id, EmploymentDate, FirstName, LastName, SSN, WorksFor)
-- SSN is the primary key
-- Only queries specified between the begin and end delimiters will
-- have their response time measured.
DELETE FROM Employees WHERE SSN = ${Employees.SSN};

${BEGIN.DELIMITER}

INSERT INTO Employees VALUES 
(null,FROM_UNIXTIME(CEIL(${Employees.EmploymentDate}/1000)),${Employees.FirstName},${Employees.LastName}, ${Employees.SSN}, ${Employees.RANDROW});

${END.DELIMITER}

DELETE FROM Employees WHERE SSN = ${Employees.SSN};
```

For instance, if a developer is interested in testing the time taken to INSERT a new employee record into his/her database, the query response time measurement should ideally reflect the time it takes to INSERT an actual row of employee data into the database. 

SQLitmus's query template allows developers to first DELETE any conflicting employee record/records from the database before testing the time it takes for the database to INSERT an actual row of employee data. This functionality allows SQLitmus to yield a more accurate query response time measurement as compared to QGEN. 

The impact of the INSERT workload on the cardinality drift of the Employees table can also be mitigated through specifying an additional DELETE statement after the INSERT is performed. Cardinality drifts are thus much more well accounted for in SQLitmus as compared to QGEN.

The full set of Query Templating options and values are as follows:

| Template                   | Values                                                       |
| -------------------------- | ------------------------------------------------------------ |
| ${`TableName`.`FieldName`} | A randomly generated value from any previously configured data generators. Note that this does not work for index and foreign key fields since they are not user-configured. |
| ${`TableName`.NUMROWS}     | The number of rows generated for a specified Table at the current test. Defaults to 10 when used in GUI testing. |
| ${`TableName`.RANDROW}     | A randomly selected value in the range of [1,NUMROWS].       |
| ${BEGIN.DELIMITER}         | Specifies when to start measuring the query response time.   |
| ${END.DELIMITER}           | Specifies when to stop measuring the query response time.    |

Note: All templates are case-sensitive.

This combination of templating options is complete in the sense that it allows developers to generate a random value of the same domain of any field of interest.

For index fields, developers can use the `${TableName.RANDROW}` templating option to generate a random index of the same domain as the generated dataset.

For non-index and foreign key fields, developers can use the `${TableName.FieldName}` option.

All foreign key fields neccessarily references a root non-foreign key target. For instance, if Table1.Field1 references Table2.Field2, developers can simply use the `${Table2.Field2}` generator to generate values for Table1.Field1. (Use `${Table2.RANDROW}` instead if Field2 is an index key)

The following scenario demonstrates how the various query templating options can be used together to insert a new row of employee data of the same domain as the generated dataset.

```plsql
-- Staffing an employee on a project (PostgreSQL)
-- Values are (id, StartDate, EndDate, ProjectName, ProjectLocation, EmployeeId, ProjectId)
-- ProjectName, ProjectLocation, and ProjectId addresses the Name, Location, and id fields of the Projects table respectively.
-- EmployeeId addresses the id field of the Employees table.
INSERT INTO "WorksOns" VALUES (DEFAULT, to_timestamp(CEIL(${WorksOns.StartDate}/1000)), to_timestamp(CEIL(${WorksOns.EndDate}/1000)),
${Projects.Name},${Projects.Location},
${Employees.RANDROW},${Projects.RANDROW});
```

- StartDate and EndDate has directly accessible generators `${WorksOns.StartDate}` and `${WorksOns.EndDate}` so we supply them accordingly.
- ProjectName and ProjectLocation references non-index fields Projects.Name and Projects.Location so we supply `${Projects.Name}` and `${Projects.Location}` accordingly.
- EmployeeId and ProjectId references the indexes of the Employees and Projects tables so we supply `${Employees.RANDROW}` and `${Projects.RANDROW}` accordingly.

All queries generated are deteministically random, so developers are able to execute the same set of randomly generated queries across different databases and different trials of the same test.

### 3.3.2 Query Template GUI

Regardless of how simple it is to use the query templating system, developers need a way of testing the validity of their query templates ahead of running any performance analyses. Developers also need a way to persist the list of already configured query templates in the software so that they do not have to spend time reconfiguring the list of queries templates that they have used in a previous test.

Similar to the database connection management module, the query template GUI has also been forked from SQLectron. The SQLectron query browser natively supports tabs, query execution, and query autocompletion.

![3.3.2](./sqlitmus%20report/3-3-2.png)

SQLitmus extends the query browser of SQLectron by offering tab persistence, query template preprocessing, query autocompletion of SQLitmus templating options, and a modified GUI that fits SQLitmus's overall design better. While the GUI is densely packed, it still offers a good user experience for developers working on the SQLitmus platform.

Developers are able to test all available SQLitmus templating options within the GUI itself. Without any additional configurations, the query template preprocessor populates the query templates with values generated from the already configured data generators. All test queries executed also target the same database that the developer is currently connected to.

No other tool in the market offers a query templating solution as sophisticated and elegant as SQLitmus.

### 3.4 Test Configurations

Developers do not simply wish to test the performance of their SQL database in a single environment. They wish to test their database under multiple environments so that they are able to identify trends that are important to them such as:

- How well their SQL database's performance scales with the amount of data it holds.
- How well their SQL database's performance scales with the number of concurrent requests it serves.

The following test configurations allow developers to specify up to 25 different environments to test their SQL database under in a single run.

#### 3.4.1 Row Configurations

![3.4.1](./sqlitmus%20report/3-4-1.png)

The row configurations tab allows developers to specify the number of rows of data they wish to generate on a tabular level. Developers are allowed to specify up to five test trials in a single run of performance analysis.

As the data generated in the last specified test persists in the database, developers who are not concerned with SQL performance testing can still use SQLitmus as a pure test data generation tool. This allows them to repurpose SQLitmus for API performance testing, and user interface development testing.

![3.4.1b](./sqlitmus%20report/3-4-1b.png)

The author of SQLitmus also recognizes that SQLitmus is neither the fastest, most robust, nor most expressive test data generator available in the market. As such, SQLitmus provides a way for developers using other test data generation tools to bypass SQLitmus's data generation process to solely capitalize on SQLitmus's elegant query templating and performance testing engine to measure their database's performance. 

If at least one input is configured with an invalid number of rows - being any negative integer - SQLitmus will skip the data generation process and proceed directly to executing the performance test. 

If all rows are supplied with zero, SQLitmus wipes the database clean of any test data and resets all automatic incrementer counters present on the database to their default values.

#### 3.4.2 Max Connection Pool Configurations

![3.4.2](./sqlitmus%20report/3-4-2.png)

The max connection pool size simulates the ability for the database to handle multiple concurrent requests from a single server. Developers can specify up to five max connection pool configurations to test their SQL databases at.

### 3.5 Running a test

![3.5](./sqlitmus%20report/3-5.png)

After the configurations are completed SQLitmus allows developers to specify a seperate Data Generation and Query generation seed. The seeds are seperated so that developers are able to to generate the exact same set of data but test the dataset using a different set of randomly generated queries. This allows developers to yield a more complete picture of 

### 3.6 Data Management

After all the performance testing is complete, developers still require a simple and effective way of managing their performance analysis results. While the data can simply be exported to other tools for data visualization purposes, the author of SQLitmus believes that a full feature data management solution optimized for visualizing query response time trends should still be made available within SQLitmus itself. This provides an additional layer of convenience for developers.

#### 3.6.1 History of test records

![3.6.1](./sqlitmus%20report/3-6-1.png)

SQLitmus stores a history of all performance analysis records that users have conducted on a database level. The history is sorted in reverse chronological order.

#### 3.6.2 Data Visualization

![3.6.2.png](./sqlitmus%20report/3-6-2.png)

The data visualization component allows developers to identify trends of their database's performance quickly without having to clean or process their data.

Developers are able to investigate their data with a high level of flexibility as the data visualization component allows developers to choose any recorded numerical data for its x-axis and group the datapoints using any recorded numerical or string data. 

The color palette was selected using HSL values to ensure that they are visibily distinct from one another. The graph axes were selected to be the minimum range capable of fitting all recorded values.

The graph and legend was developed through using the `react-easy-graph` library and the colour selection algorithm was taken from [stackoverflow ans].

#### 3.6.3 Data filtering

![3.6.3](./sqlitmus%20report/3-6-3.png)

The data filtering component provides a way for developers to filter down the the large dataset that they are working with to zoom deep into trends of interest.

It allows developers to filter the graphed dataset using a combination of filtering rules specified at a column level. It also uses a powerful filtering engine to afford developers more flexibility.

The word filtering mechanism allows developers to search the string datasets using intuitive search values. It does not require developers to use complex regex expressions but provides an almost identical level of expressive capability for this intended purpose. It was developed using the help of the `match-sorter` library.

The number filtering mechanism allows developers to use a combination of intuitive search rules to find their data. The operators supported are: `>=`, `<=`, `>`, `<`, `=`, `&&`, `||`.



## 7. Appendix

### 7.1 Query Templates

```mysql
# Insert new employee (MySQL)
DELETE FROM Employees WHERE SSN = ${Employees.SSN};
${BEGIN.DELIMITER}
INSERT INTO Employees VALUES 
(null,FROM_UNIXTIME(CEIL(${Employees.EmploymentDate}/1000)),${Employees.FirstName},${Employees.LastName}, ${Employees.SSN}, ${Employees.RANDROW});
${END.DELIMITER}
DELETE FROM Employees WHERE SSN = ${Employees.SSN};

# Insert new employee (PostgreSQL)
DELETE FROM "Employees" WHERE "SSN" = ${Employees.SSN};
${BEGIN.DELIMITER}
INSERT INTO "Employees"  VALUES 
(DEFAULT, to_timestamp(CEIL(${Employees.EmploymentDate}/1000)),
${Employees.FirstName},${Employees.LastName}, ${Employees.SSN}, 
${Employees.RANDROW});
${END.DELIMITER}
DELETE FROM "Employees" WHERE "SSN" = ${Employees.SSN};

# Insert new project and details (MySQL)
DELETE FROM Projects WHERE Name = ${Projects.Name} AND Location = ${Projects.Location};
DELETE FROM ProjectDetails WHERE ProjectName = ${Projects.Name} AND ProjectLocation = ${Projects.Location};
${BEGIN.DELIMITER}
INSERT INTO Projects VALUES (null,${Projects.Name},${Projects.Location}, ${Projects.Priority});
INSERT INTO ProjectDetails Values (null, FROM_UNIXTIME(CEIL(${ProjectDetails.StartDate}/1000)), 
FROM_UNIXTIME(CEIL(${ProjectDetails.EndDate}/1000)),${ProjectDetails.Price}, 
${ProjectDetails.ManHours}, ${Projects.Name}, ${Projects.Location},(SELECT max(id) id FROM Projects));


# Insert new project and details (PostgreSQL)
DELETE FROM "Projects" WHERE "Name" = ${Projects.Name} AND "Location" = ${Projects.Location};
DELETE FROM "ProjectDetails" WHERE "ProjectName" = ${Projects.Name} AND "ProjectLocation" = ${Projects.Location};
${BEGIN.DELIMITER}
INSERT INTO "Projects" VALUES (default,${Projects.Name},${Projects.Location}, ${Projects.Priority});
INSERT INTO "ProjectDetails" Values (DEFAULT, to_timestamp(CEIL(${ProjectDetails.StartDate}/1000)), 
to_timestamp(CEIL(${ProjectDetails.EndDate}/1000)),${ProjectDetails.Price}, 
${ProjectDetails.ManHours}, ${Projects.Name},${Projects.Location}, (SELECT "id" FROM "Projects" ORDER BY id DESC LIMIT 1));

#Staff an employee on a project (MySQL)
DELETE FROM WorksOns WHERE ProjectName = ${Projects.Name} AND ProjectLocation = ${Projects.Location};
${BEGIN.DELIMITER}
INSERT INTO WorksOns VALUES (null,FROM_UNIXTIME(CEIL(${WorksOns.StartDate}/1000)),
FROM_UNIXTIME(CEIL(${WorksOns.EndDate}/1000)),${Projects.Name},${Projects.Location},
${Employees.RANDROW},${Projects.RANDROW});

#Staff an employee on a project (PostgreSQL)
INSERT INTO "WorksOns" VALUES (DEFAULT,to_timestamp(CEIL(${WorksOns.StartDate}/1000)),
to_timestamp(CEIL(${WorksOns.EndDate}/1000)),${Projects.Name},${Projects.Location},
CEIL(random()*${Employees.numRows}),CEIL(random()*${Projects.numRows}));
SELECT * FROM "WorksOns" ORDER BY id DESC LIMIT 1;

#View all active projects at date (MySQL)
SELECT Projects.Name, Projects.Location, StartDate, EndDate, Price, ManHours 
FROM ProjectDetails 
JOIN Projects ON Projects.Name=ProjectDetails.ProjectName 
AND Projects.Location=ProjectDetails.ProjectLocation
WHERE StartDate < FROM_UNIXTIME(CEIL(${ProjectDetails.StartDate}/1000)) 
AND EndDate > FROM_UNIXTIME(CEIL(${ProjectDetails.StartDate}/1000));

#View all active projects at date (PostgreSQL)
SELECT "Name", "Location", "StartDate", "EndDate", "Price", "ManHours" 
FROM "ProjectDetails" , "Projects"
WHERE "ProjectName" = "Name" 
AND "ProjectLocation" = "Location"
AND "StartDate" < to_timestamp(CEIL(${ProjectDetails.StartDate}/1000))
AND "EndDate" > to_timestamp(CEIL(${ProjectDetails.StartDate}/1000));

#All employees working on project X (MySQL)
SELECT Employees.id, Employees.FirstName, Employees.LastName, 
Employees.SSN, WorksOns.ProjectName, WorksOns.ProjectLocation 
FROM Employees, WorksOns, Projects 
WHERE WorksOns.EmployeeId = Employees.id 
AND WorksOns.ProjectName LIKE Projects.Name 
AND WorksOns.ProjectLocation LIKE Projects.Location
AND Projects.id = ${Projects.RANDROW};

#All employees working on project X (PostgreSQL)
SELECT "Employees".id, "FirstName", "LastName", "SSN", "ProjectName", "ProjectLocation"
FROM "Employees" , "WorksOns", "Projects"
WHERE "Employees".id = "EmployeeId"
AND "WorksOns"."ProjectName" = "Projects"."Name"
AND "WorksOns"."ProjectLocation" = "Projects"."Location"
AND "Projects".id = ${Projects.RANDROW};

#All projects employee x works on (MySQL)
SELECT Projects.id, Name, Location, EmployeeId 
FROM Projects JOIN WorksOns 
ON Projects.Name = WorksOns.ProjectName 
AND Projects.Location = WorksOns.ProjectLocation
WHERE WorksOns.EmployeeId=${Employees.RANDROW};

#All projects employee x works on (PostgreSQL)
SELECT "Projects".id, "Name", "Location", "EmployeeId"
FROM "Projects" , "WorksOns"
WHERE "Name" = "ProjectName"
AND "Location" = "ProjectLocation"
AND "WorksOns"."EmployeeId" = ${Employees.RANDROW};

# All subordinates of employee x (MySQL)
SELECT * FROM Employees WHERE WorksFor=${Employees.RANDROW};

# All subordinates of employee x (PostgreSQL)
SELECT * FROM "Employees" WHERE "WorksFor" = ${Employees.RANDROW};

# Change project location (MySQL)
${BEGIN.DELIMITER}
UPDATE Projects SET Location = 'NEW RANDOM LOCATION' 
WHERE Projects.Name=${Projects.Name} AND Projects.Location=${Projects.Location};
UPDATE WorksOns SET ProjectLocation = 'NEW RANDOM LOCATION' 
WHERE WorksOns.ProjectName=${Projects.Name} AND WorksOns.ProjectLocation=${Projects.Location};
UPDATE ProjectDetails SET ProjectLocation = 'NEW RANDOM LOCATION' 
WHERE ProjectDetails.ProjectName=${Projects.Name} 
AND ProjectDetails.ProjectLocation=${Projects.Location};
${END.DELIMITER}
UPDATE Projects SET Location = ${Projects.Location} 
WHERE Projects.Name=${Projects.Name} AND Projects.Location='NEW RANDOM LOCATION';
UPDATE WorksOns SET ProjectLocation = ${Projects.Location} 
WHERE WorksOns.ProjectName=${Projects.Name} AND WorksOns.ProjectLocation='NEW RANDOM LOCATION';
UPDATE ProjectDetails SET ProjectLocation = ${Projects.Location} 
WHERE ProjectDetails.ProjectName=${Projects.Name} 
AND ProjectDetails.ProjectLocation='NEW RANDOM LOCATION';

# Change project location (PostgreSQL)
${BEGIN.DELIMITER}
UPDATE "Projects" SET "Location" = 'NEW RANDOM LOCATION'
WHERE "Projects"."Name"=${Projects.Name} 
AND "Projects"."Location"=${Projects.Location};
UPDATE "WorksOns" SET "ProjectLocation" = 'NEW RANDOM LOCATION'
WHERE "WorksOns"."ProjectName"=${Projects.Name} 
AND "WorksOns"."ProjectLocation"=${Projects.Location};
UPDATE "ProjectDetails" SET "ProjectLocation" = 'NEW RANDOM LOCATION' 
WHERE "ProjectDetails"."ProjectName"=${Projects.Name}
AND "ProjectDetails"."ProjectLocation"=${Projects.Location};
${END.DELIMITER}
UPDATE "Projects" SET "Location" = ${Projects.Location}
WHERE "Projects"."Name"=${Projects.Name} 
AND "Projects"."Location"='NEW RANDOM LOCATION';
UPDATE "WorksOns" SET "ProjectLocation" = ${Projects.Location}
WHERE "WorksOns"."ProjectName"=${Projects.Name} 
AND "WorksOns"."ProjectLocation"='NEW RANDOM LOCATION';
UPDATE "ProjectDetails" SET "ProjectLocation" = ${Projects.Location}
WHERE "ProjectDetails"."ProjectName"=${Projects.Name}
AND "ProjectDetails"."ProjectLocation"='NEW RANDOM LOCATION';

# Delete employee (MySQL)
INSERT INTO Employees Values (null,FROM_UNIXTIME(CEIL(${Employees.EmploymentDate}/1000)),
${Employees.FirstName},${Employees.LastName}, 
${Employees.SSN}, ${Employees.RANDROW});
${BEGIN.DELIMITER}
DELETE FROM Employees WHERE SSN = ${Employees.SSN};

# Delete employee (PostgreSQL)
INSERT INTO "Employees" Values (DEFAULT,to_timestamp(CEIL(${Employees.EmploymentDate}/1000)),
${Employees.FirstName},${Employees.LastName}, 
${Employees.SSN}, ${Employees.RANDROW});
${BEGIN.DELIMITER}
DELETE FROM "Employees" WHERE "SSN" = ${Employees.SSN};

# Unstaff employee x from project y (MySQL)
INSERT INTO WorksOns Values (null,${WorksOns.StartDate},
${WorksOns.EndDate},${Projects.Name},${Projects.Location},${Employees.RANDROW},${Projects.RANDROW});
${BEGIN.DELIMITER}
DELETE FROM WorksOns WHERE ProjectName=${Projects.Name} 
AND ProjectLocation=${Projects.Location} AND EmployeeId=${Employees.RANDROW};
${END.DELIMITER}

# Unstaff employee x from project y (PostgreSQL)
INSERT INTO "WorksOns" Values (DEFAULT,to_timestamp(${WorksOns.StartDate}),
to_timestamp(${WorksOns.EndDate}),${Projects.Name},${Projects.Location},${Employees.RANDROW},
${Projects.RANDROW});
${BEGIN.DELIMITER}
DELETE FROM "WorksOns" WHERE "ProjectName"=${Projects.Name} 
AND "ProjectLocation"=${Projects.Location} AND "EmployeeId"=${Employees.RANDROW};
${END.DELIMITER}


# Unstaff all employees of project y (MySQL)
DELETE FROM WorksOns 
WHERE ProjectName=${Projects.Name} AND ProjectLocation=${Projects.Location};


# Unstaff all employees of project y (PostgreSQL)
DELETE FROM "WorksOns" 
WHERE "ProjectName"=${Projects.Name}  AND "ProjectLocation"=${Projects.Location};
```


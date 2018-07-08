# SQLitmus: A Simple and Practical Tool for SQL Database Performance Testing

[TOC]

## Author's note

I worked on SQLitmus as part of my senior thesis at Yale-NUS College. This markdown hosts an older version of the SQLitmus project. For the full report written in latex, see the PDF file [here](https://github.com/Aaronong/SQLitmus/blob/master/sqlitmus%20report/main.pdf).

If you want to know how this software looks like and what it is about, look at section 3.

To install the application:

```{bash}
git clone https://github.com/Aaronong/SQLitmus
cd SQLitmus
yarn install
```



## Abstract

This paper presents SQLitmus, a simple and practical tool for SQL database per- formance testing. SQLitmus was developed to help developers of small-to-mid sized projects conduct quick litmus tests of their SQL databases’s performance. With minimal configurations, SQLitmus populates a test database with large volumes of realistic and Schema-compliant test data, and runs randomized queries against the database to analyze its performance. The graphical interface also offers a data plotting and filtering tool to help developers visualize their performance test results. 

SQLitmus is compatible with Windows, MacOSX, and Linux machines and sup- ports MySQL, PostgreSQL, and MariaDB databases. 

The pilot study was conducted to test SQLitmus against three databases: MySQL, PostgreSQL, and MariaDB. All of these databases are systems provisioned by Ama- zon Web Service’s Relational Database Service (AWS RDS). 

The results demonstrates that SQLitmus is capable of generating repeatable and reliable performance analyses of SQL databases. The software recorded clear trends of SQL databases slowing down as their size (amount of data stored) and workload (number of concurrent connections) increased. 

Results also revealed performance discrepancies across databases running on identical hardware, data-set, and queries. This shows that SQLitmus can provide developers with intelligence to decide between replaceable databases, queries, and data storage options (e.g., time-stamp vs. date object). 

## 1. Introduction

With the ever-growing volume of internet traffic, and the lasting popularity of SQL databases[foot][A class of databases that is only allowed to store structured data, and provides a structured mechanism by which developers retrieve data], SQL database performance testing tools are increasingly neccessary.

SQL database performance analysis tools usually falls under one of the three categories:

- Database benchmarking tools: uses stock schemas [foot][specifies the types of structured data a SQL databases allowed to store], data, and queries [foot][The mechanism by which SQL databases receives read or write requests] to test for a particular development database's[foot][a database used for testing purposes] performance.

- Test data generation tools: allows developers to populate a development database with test data[FOOT][FOOTNOTE: meaningful data with statistical properties that approximate a production environment] that complies with the database's schema. The test data is used to simulate the large load of data that production databases[foot][a database that serves its intended end-users.] face.
- Live performance monitoring tools: connects to a database in production and monitors all of the transactions carried out by the database.



### 1.1 A Case for using test data generation tools

While Test data generation tools are the least used in industry today, this sub-section makes a case for developers and database administrators (henceforth represented by the term: developers) alike to include test data generation tools into their SQL database testing workflow.

Database benchmarks while robust, fast, and easy to use, are tested using stock schemas  and data. Such benchmarks provide developers with a good estimate of their database system's general performance. However, developers are not allowed to configure benchmarking software to use their custom schema, test data, or queries.

Live performance monitoring tools, on the other hand, does not simulate a database's performance, rather it pulls performance data from the actual database in production and displays it on a dashboard for database administrators to monitor their database system's actual performance. While they generally provide the most accurate measure of a database system's performance by monitoring actual workloads, they have several shortcomings.

Live performance monitoring tools are only able to spot performance issues after they have occured in a production environment when fixing performance issues are expensive. When fixing performance issues in production, developers are required to backup their data consistently to ensure that the newly deployed fixes do not cause them to lose important data. As such developers are only able to make conservative fixes after the database is deployed into production.

Test data generation tools are a less reliable, less rigourous, and more cumbersome form of testing. As such, they are often excluded from SQL database testing workflows. They do, however, allow developers to test for their database system's approximate performance in production by generating a large enough set of test data to simulate a production database's workload. They also allow developers to spot obvious performance issues in advance of deploying the database system into production. This affords developers the flexibility of making drastic changes to their database's overall design during the development phase where the costs of deploying fixes are low. 

That being said, there are significant drawbacks to using test data generation tools. They are cumbersome to configure, and require a seperate tool to run, measure, and visualize their database's performance. It is usually the case that developers require multiple rounds of test data generation, and performance measurements to be conducted before they are able to gain a sense of their development database's performance. Also, it is generally an understood fact that generated data, no matter how well configured, are only an approximation of actual data. Thus, while performance analyses conduct by test data generators are much more reliable that database benchmarks, they still do not compare to actual performance monitoring.

The above discussion points towards the need for a test data generation tool that is simple to use and reliable, such that developers will be convinced of the value of including such tools into their SQL database testing workflow.



### 1.2 Claims & Contributions

This paper introduces SQLitmus, a simple and practical tool for SQL database performance testing. It is the first open-source software platform that integrates test data generation and population, test query generation and execution, and database performance visualization within a single tool. (Section 3)

The paper also introduces a new method of query templating that advances upon the query templating technique used in QGEN (Sub-sections 2.2 and 3.3)

### 1.3 Report Outline

This paper first discusses related work in (Section 2), then articulates the features offered by SQLitmus in (Section 3).

With those features articulated, the paper then performs a walkthrough of how SQLitmus can be used to test the performance of SQL databases in (Section 4), discusses some useful performance analysis results yielded from SQLitmus in (Section 5), and finally summarizes the paper in (Section 6).

## 2. Related Work

SQLitmus is in essence both a test data generation, and test query generation tool. This section will discuss related works in academia and industry pertaining to test data and query generation.

### 2.1 Test Data Generation

Since the development of DBGEN [FOOTNOTE - the first data generator developed by the Transaction Processing Performance Council (TPC)] in 1992, frameworks and techniques for generating data have been explored substantially across academia and industry.

Significant research have been conducted on improving the speed of data generation. [Grey et al, 1994] presented a technique that allows for fast, parallel generation of data in linear time. The limitation with Grey's model is that the number of processors participating in the parallel data generation process is fixed from the start. [Rabl et at, 2010] solved this limitation by proposing a technique that allows for the participation of an arbitrary number of processors while not incurring an increased communication overhead.

Techniques for improving the expressiveness of data generators have also been expored. [Bruno & Chaudhari, 2005] presented a flexible and easy to use framework for data generation. Their research introduced a graph-based evaluation model which is capable of modelling data distributions with rich intra-row and inter-table correlations. [Houkjaer et al, 2006] also presented a similar graph-based model but diverges from Bruno & Chaudhari's model by achieving intra-column dependencies at the cost of enforcing sequential data generation. 

Notable academic works implemented in industry include DBGEN for TPC-H benchmarking [Poess & Floyd, 2000] and MUDD for TPC-DS benchmarking [Stephens & Poess, 2004]. Both of which are data generators used for benchmarking purposes and cannot be configured to support custom schemas. 

While academia have advanced many techniques for generating test data more quickly and expressively, few commercially available data generators developed to this date have implemented these advanced techniques.

Where there are many factors that may have contribute to such an outcome, the author believes that it is simply due to a lack of economic incentive. Test data generation tools are not a part of most SQL database performance analysis workflows, and the economic pressure on companies developing such software can be seen from the price of test data generation tools as opposed to other database monitoring tools. [Red Gate products, which are marketed, average price, comparing solarwind]

An additional factor may also be the fact that most test data generation tools generate data using a client-side computer, and the large datasets they are tasked to generate warrants that the datasets are stored on-disk as opposed to in-memory. As such, test data generation tools in practice hardly benefit from generating data in parallel, and developers are disincentivized to use test data generation tools due to the long time it takes to run a single test.

Notable commercially-available test data generation tools that support custom schemas and referential integrity includes DTM, Red Gate, and GEDIS Studio. All of the above-mentioned software feature a rich set of configurations and data generation logic that allows developers to generate relatively expressive datasets. They all also feature seeded random data generation, which affords developers the ability to generate identical sets of data across multiple databases. This allows for a fair benchmarking test to be conducted across databases.

Red Gate provides developers with the additional functionality of importing data from existing sources. This allows the test data generation tool to generate its test data from the most reliable source of data - the actual data retrieved from the production database.

DTM, on the other hand, offers developers with the widest range of test data generation functions and expression processors. Developers are able to define complex dependencies across rows and down columns using DTM - the most expressive test data generation tool available in the market. 

GEDIS Studio while relatively more modest in its offerings, is a free web-based data generator.

DTM (Standard edition) and Red Gate retail for \$149 and \$369 respectively. 

None of the above-mentioned generators offer parallel data generation or the ability to define data dependencies across relations or tables. They also require a substantial amount of effort to configure, and require developers to spend a fair amount of time to familiarize themselves with it. 

### 2.2 Test Query Generation

Test Query Generation in comparison is a much less researched field. [Poess & Ross] presented QGEN, a query generation technique that couples the use of a query template and a query pre-processor. QGEN's preprocessor parses a query template for values marked for subtitution and substitues them using one of the the supported substitution rules:

- Random substitution: returns a normally or uniformly distributed integer within a supplied range.
- Distribution substitution: returns a random element picked from a list of values generated by the MUDD data generator. 
- Text substitution: returns a random element picked from a list of custom values and weights.

When QGEN is used to generate queries against a dataset generated from MUDD, the queries yield more accurate benchmarking results - This is due to the fact that the substituted values belong to the same domain as the values generated in the database. 

Regardless of the high likelihood of generating queries that target data that actually resides on the database, QGEN still faces two critical flaws:

- It has no way of ensuring that the generated queries are targeting available data.
- It has no way of ensuring that the impacts of write queries such as INSERT and DELETE do not modify the cardinality of the dataset.

That being said, QGEN presents a noticable improvement upon the query generators used in notable datawarehouse benchmarks such as TPC-D, TPC-H, and TPC-R which uses simple substitution mechanisms that are not aware of the data present in the dataset.

### 2.3 Implications on SQLitmus

SQLitmus began as a project to develop a test data generator which allows developers to specify complex intra-row[FOOTNOTE: data dependencies across a single row], intra-column[FOOTNOTE: data dependencies down a single column], and inter-table[FOOTNOTE: data dependencies across a foreign-key relation] data dependencies. It was originally a project to develop a test data generator with more expressive capability than any of the commercially available options discussed in (Section 2.1). 

However, the author of SQLitmus was compelled by the following reasons to direct the vision of SQLitmus elsewhere:

1. There is already a large pool of expressive test data generation tools to choose from.
2. Test data, no matter how expressive, still relies on the developer to research and approximate production data in their test database. The incremental benefit of devloping a more expressive test data generation tool provides marginal improvements to the reliability of its derived performance analysis.
3. A more expressive test data generator will be even more cumbersome to use.
4. There is currently no test data generation tool available that developers of small to medium sized projects feel compelled to use. 
5. Developers of small to medium sized projects are priced out from expensive database monitoring tools. Hence, a case could be made that they will benefit more from test data generation tools.

Owing to the above-mentioned reasons, SQLitmus pivoted into a project to make database performance testing accessible to developers of small to medium sized projects.

#### 2.3.1 Data generation implications

Regardless of SQLitmus's new direction, SQLitmus is still expected to be a respectable test data generation tool that implements advanced techniques researched by notable academics. 

To support referential integrity, SQLitmus determines the priority of data generation through a graph model. SQLitmus's graph model is adapted from the graph models proposed by [Bruno & Chaudhari, 2005] and [Houkjaer et al, 2006]. Table 5a details where the three models converge and diverge.



<u>Table 5a</u>

|               | [Houkjaer et al, 2006]                                       | [Bruno & Chaudhari, 2005]                                    | SQLitmus                                                     |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Priority**  | Determines data generation priority between tables           | Determines data generation priority between tables and columns | Determines data generation priority between tables and columns. |
| **Nodes**     | Nodes carry table data                                       | Nodes carry table data                                       | Nodes carry table data and field data. Nodes carry information on foreign keys. |
| **Edges**     | Three types of directed edges                                | One type of directed edge                                    | Three types of directed edge                                 |
| **Edge data** | Edges carry information on foreign keys and cardinality distributions | Edges carry no information                                   | Edges carry no information. A seperate data model supplies cardinality distributions. |



**Priority:** Like Bruno & Chaudhari's model, SQLitmus's graph model is capable of detemining the order of data generation between tables and columns. While SQLitmus's graph model is capable of supporting intra-row data dependencies, the feature has been de-prioritized to be implemented at a later date - since offering intra-row dependencies neccessarily clutters the GUI and forces developers to make additional configurations. The graph model is currently used to specify the order between tables, and to delay the generation of self-referential foreign keys. Self-referential foreign keys must neccessarily be generated after the column of the same table that it references.

**Nodes:** Nodes in SQLitmus stores referential constraints on a field level which are then parsed to generate referential constraints on a table level. Storing referential constraints on a field level allows SQLitmus to generate self-referential foreign keys and composite foreign keys with more ease.

**Edges:** Like Houkjaer's model, SQLitmus's graph model supports Normal, Forward, and Backward edges. Simple and composite primary and foreign keys are supported. Only simple self-referential foreign keys are supported.

#### 2.3.2 Query Generation implications

On the query generation front, SQLitmus employs a similar methodology as QGEN. It also uses a combination of query templates and query pre-processors to generate random queries of high quality. In fact, SQLitmus's query generator arguably generates random queries of higher quality as compared to the query templating function employed by QGEN. It requires no additional configurations as it simply uses the exact same set of data generators already configured for use by the test data generator. SQLitmus's templating options are also much more robust and flexible as compared to those available in QGEN. It provides functionalities that addresses the two critical flaws of QGEN's query generation technique discussed in (Subsection 2.2). It is able to guarantee that every SELECT, INSERT, UPDATE, and DELETE query affects at least one row of available data when used correctly. It is also able to reverse the impact of INSERT and DELETE statements and ensures that the cardinality of the dataset does not drift off too much as test queries are being executed. Its only critical flaw is that it is currently unable to reverse the impact of bulk delete statements.

Techniques to ensure zero drift in the cardinality of the test dataset while not implemented, have been devised, and will be presented in (Subsection 6.2). 

#### 2.3.3 Random Number Generation (RNG)

To generated deteministically random sets of data across multiple test sessions and databases, SQLitmus relies on the `PCG-XSH-RR` RNG introduced by [O'Neill, 2014]. The above-mentioned RNG belongs to the permuted congruential generator (PCG) family of random number generators. The RNG was selected for the following properties:

- Seeded - Allows for identical RNG sequences to be generated across different runs.
- Fast - Generates the next state at a very low constant cost
- Logarithmic random access - Able to jump ahead to the nth number in the RNG sequence in log(n) time.
- High periodicity - A period of 2^n where n is the number of bits used to store the state.
- High uniformity - At any point of the random number generation process, generated numbers occur at highly uniform frequencies across the range.

SQLitmus employs a 64-bit implementation of the RNG which is has a period of 2^64, much higher than the current data size generation limit that SQLitmus supports. The fast logarithmic random access times when used in conjunction with the PDGF seeding strategy proposed by [Rabl et al, 2010] will enable SQLitmus to generate data with intra-row, inter-column, and inter-table dependencies without performing expensive disk reads. This feature while impressive, is currently not part of SQLitmus's key focus, and thus has been deprioritized.

SQLitmus also utilizes a good multiplier constant proposed by [L'ecuyer, 1999] to ensure a high uniformity in randomly generated numbers.

#### 2.3.4 Trade Offs

![https://queue.acm.org/detail.cfm?id=1563874](./sqlitmus%20report/2-3-4.png)

For each test, SQLitmus is only able to generate data up to the the amount of RAM available on the client side computer. This is because SQLitmus stores the entire dataset in memory. This trade-off is made for the following reasons:

- While SQLitmus generates and is capable of storing data sequentially, the database currently used to manage the data generation process, NeDB, only allows random access updates. 
- Data generation will be approximately 1,000,000 times faster on RAM vs HDD
- Data generation will be approximately 200,000 times faster on RAM vs SSD
- There is no need to persist the data generated by SQLitmus (It is already on a database)
- Developers of small and medium sized applications rarely store more than 10gb of data
- Large binary objects such as flat files and pictures are usually stored in the server.

To reiterate, the key goal of SQLitmus is to assist developers of small to medium sized applications in performing quick litmus scans of their database's performance. Trading-off speed and convenience in return for generating large datasets that such databases are unlikely to support is thus undesirable.

Nonetheless, SQLitmus is intending to rework its data generation process to off-load most of the in-memory data storage to disk (Since transfering a random access load in-memory to a sequential load on-disk actually provides a performance benefit). If this effort is successful, SQLitmus will be able to generate data at an almost constant speed while requiring that only the dataset currently being generated resides in memory. This future work will be discussed in (Section 6.2).

## 3. SQLitmus Features

Every good software begins by serving the needs of its target users well. This section begins by enunciating the user stories that developers of small to medium sized applications want from SQL database performance analysis tools. 

As a user, I want...

- A performance test that is reliable, so that I am sure that the performance testing is accurate.
- A performance test that is repeatable, so that I am able to test for the impacts of the new configurations I made.
- A performance test that is repeatable, so that I am able to select the most suitable database system to use.
- A way to save my configurations, so that I do not have to waste time reconfiguring my tests.
- An easy and convenient way of testing my SQL databases, so that I can focus my efforts on developing my software.
- A good way of visualizing my performance testing data, so that I do not have to waste time exporting them into another software.
- A way to test my database's performance under multiple configurations, so that I can identify performance bottlenecks and trends more effectively. 
- A way to test my database under different data loads, so that I have a sense of how well my database scales with an increasing data load.
- A way to test my database under different numbers of concurrent connections, so that I have a sense of how well my database scales with an increasing number of concurrent users.
- A way to test my database with multiple types of queries, so that I have a more complete understanding of my database's performance.
- A way to specify the types of data I wish to generate, so that I can ensure that they are compliant with my database schema.
- A way to specify the types of queries I wish to test, so that the test results are more representative of my software's actual performance.
- A software that guides me through the configuration process, so that I do not have to spend time figuring it out.
- A way to test my database quickly, so that I do not have to wait too long to see the results of my test.

With the user stories enunciated, the remainder of this section demonstrates how SQLitmus's feature set provides a solution for all of the above-mentioned user stories.

Note that the feature set in this section is often explained through the use of the test scenario presented in (Section 4). While this section is designed to be self-sufficient, readers may opt to refer to the test design in (Section 4) to gain a clearer understanding of the specific scenario used. For readers who are unfamiliar with how SQL databases operate, the author recommends reading (Section 4) first.

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

## 4. Designing a robust test for SQLitmus

To demonstrate the capabilities of SQLitmus, the following test was devised.

### 4.1 Test Schema

![4.1](./sqlitmus%20report/4-1.png)

The selected test schema was adapted from a similar study conducted by [Houkjaer et al].

The schema proposed by [Houkjaer et al] tests SQLitmus for the following capabilities:

- Generating simple primary keys (Employees.id)
- Generating composite primary keys (Projects.Name & Projects.Location)
- Generating self-referential foreign keys (Employees.WorksFor -> Employees.id)
- Generating simple many-to-one foreign keys (WorksOns.EmployeeId -> Employees.id)
- Generating composite one-to-one foreign keys (ProjectDetails -> Projects)
- Generating composite many-to-one foreign keys (WorksOns -> Projects)
- Generating many-to-many relationships (Employees & Projects through WorksOns)

The following modifications were made to the schema proposed by [Houkjaer] for the following reasons:

| Modification                                                 | Rationale                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Employees.SSN is specified as the primary key of the Employees table. | Tests for SQLitmus's ability to generate primary keys of integer type that respects a configured data generator. |
| ProjectDetail.Price is configured as a numeric type with a precision of 10 and scale of 2. | Tests for SQLitmus's ability to generate numerical data of a specific precision and scale. |
| ProjectDetail.EndDate and WorksOn.EndDate are configured to be nullable field. | Tests for SQLitmus's ability to generate null fields of a specified null rate. |
| ProjectDetail.ProjectId and WorksOn.ProjectId are added to their respective tables. | The javascript library used to generate the test schema, Sequelize, is unable to generate composite foreign keys that do not contain integer fields. This workaround was employed to satisfy that constraint. |



### 4.2 Test Queries

Based on the test schema, a list of query templates were tested for their performance. The list was selected based on transactional workloads that the test schema was likely to face in a production environment.

The following list of workloads were tested for:

- Hire a new Employee (Insert new Employee record)
- Starting a new Project (Insert new Project record and associated ProjectDetails record)
- Staff an employee on a project (Insert WorksOn record)
- View all active projects at a specified date
- View all employees working on a specific project
- View all projects a specific employee is working on
- View all direct subordinates of a specific employee
- Changing a specified Project record's location (Update a Project record and all associated ProjectDetail and WorksOn records)
- Firing an Employee (Delete Employee record)
- Unstaff an Employee from a project (Delete WorksOn record)
- Ending a project (Delete multiple WorksOn records)

The respective query templates for PostgreSQL and MySQL databases can be found in appendix 1. Despite the differences in the SQL dialects used by both databases, attempts have been made to test both dialects with nearly identical queries.

### 4.3 Test Configurations

The screenshots below specify the row and connection configurations for the test.

![4.1](./sqlitmus%20report/4-3.png)

The rows selected for the test does not reflect the size of typical company records. Rather, they were selected for to test a typical test data generation workload that the target users of SQLitmus are likely to generate. The above specifications generates a total of 518,600 rows and 3,527,200 fields of data.

![4.3b](./sqlitmus%20report/4-3b.png)

Similar to the row configurations, the max connection pool configurations were also selected to represent a typical connection pool workload that an average SQLitmus user is likely to test.

## 5. Pilot Study

The pilot study ran SQLitmus against three databases: MySQL, PostgreSQL, and MariaDB. All of which were db.t2.micro [foot][Each db.t2.micro instance comes with one virtual cpu, 1GB of RAM, and 20GB of storage.] instances provisioned by Amazon Web Service's Relational Database Service (AWS RDS) . 

Each of the three databases were tested over three trials to test for the reliability of performance analyses conducted by SQLitmus.



### 5.1 Results

![2](./sqlitmus%20report/MySQL.png)

![2](./sqlitmus%20report/pgsql.png)



![2](./sqlitmus%20report/Maria.png)

### 5.2 Discussion



## 6. Summary

In this paper we presented SQLitmus, a SQL database performance analysis tool. While it is less sophisticated than other advanced data generators (e.g. [21, 7, 13, 14]), it is far easier to configure, and features a full-blown GUI for managing all aspects of performance analysis - from data generation, and query generation, to environment configuration, and data management. SQLitmus also offers a query templating engine that is more expressive and easier to configure than QGEN - one of the most advanced query generators available. 

The pilot study of SQLitmus also demonstrated that the tool is capable of generating repeatable and reliable performance analyses of SQL databases. The software recorded clear trends of SQL databases slowing down as their size (amount of data stored) and workload (number of concurrent connections) increased.

It also revealed performance discrepancies across databases installed on the same identical hardware.

### 6.1 limitations

SQLitmus used many open-sourced libraries to speed up its development. While this is usually not a large concern, SQLitmus is a performance-critical application. As it currently stands, SQLitmus is hardly well-tuned and optimized. 

While SQLitmus is able to minimize the impact of network instability by providing median values, a long enough duration of network instability invalidates any form of  Network instability is a confounding variable that SQLitmus has been unable to account for. Developers using SQLitmus 

box plots

network, db used

In this paper we presented a framework for parallel data generation for benchmarking
purposes. It uses XML files for the data definition and the configuration
file. Like other advanced data generators (e.g. [21, 7, 13, 14]) it features
dependencies between relations and advanced distributions. However, it uses a
new computational model, which is based on the fact that pseudo random numbers
can be recomputed deterministically. Using parallel pseudo random number
generators, dependencies in data can be efficiently solved by recomputing referenced
data values. Our experiments show, that this model allows our generic,
Java implemented data generator to compete with C implemented, specialized
data generators.
For future work we are intending to further expand our set of generators and
distributions. Furthermore, we will implement a GUI to allow a more convenient
configuration. We also want to include other features, as for example schema
and distribution retrieval from existing databases. To further increase the performance,
we will include new schedulers that reduce wait times for slower nodes,
as well as caching strategies to reduce re-computation of repeatedly used values.
To complete our benchmarking suite, we will use the data generator to implement
a query generator. For this we will introduce time series generators.
This will enable the generation of varying query streams as we presented in [19].
Furthermore, it will enable realistic time related data generation.

### 6.2 future work



Techniques to ensure zero drift in the cardinality of the test dataset while not implemented, have been devised, and will be presented in (Subsection 6.2). 

The rate of data generation is currently limited by the nedb library. While SQLitmus's algorithm ensures that only sequential reads and writes are executed, NEDB does not allow sequential inserts or updates. 

Nonetheless, SQLitmus is intending to rework its data generation process to off-load most of the in-memory data storage to disk (Since transfering a random access load in-memory to a sequential load on-disk actually provides a performance benefit). If this effort is successful, SQLitmus will be able to generate data at an almost constant speed while requiring that only the dataset currently being generated resides in memory. This future work will be discussed in (Section 6.2).

### 6.3 conclusion



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


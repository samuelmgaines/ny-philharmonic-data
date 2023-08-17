# Sam Gaines - New York Philharmonic Data Project (In Progress)

## Project Description

### The New York Philharmonic Orchestra
The New York Philharmonic Orchestra is a prominent American orchestra: one of the "Big Five." It held its first concert on December 7, 1842, and has since merged with the New York Symphony and the New/National Symphony.

### New York Philharmonic Data
The New York Philharmonic Orchestra has graciously made available data on every performance in its history. This data includes programs, each time/place the program was performed, works performed in the program, and conductors/soloists that were part of each work. Data in this project is pulled from https://github.com/nyphilarchive/PerformanceHistory.

### Project Scope
This project offers two functions:
1. An API to aid in sifting through the large amount of data
2. A web interface to provide a more user-friendly way of sifting through and analyzing the data (not yet available)

## Overview

### API
The API, found in the `/api` folder, is implemented with the Express.js library. `app.js` contains the functionality of the API.

### Interface
The interface is not yet available.

## API Usage

### Running the Server
Navigate to the `/api` directory. Before running the server, set the desired port for it to run on in `config.js`. Then, start the server by running the command `node app.js` or `nodemon app.js`. When the message `Data retrieved` has appeared in the terminal, the server is ready to be used.

### API Endpoints

#### GET /programs
Returns an array of all programs that match the given criteria

Query Parameters (optional):
 - `startDate`: string (yyyy-MM-dd)
 - `endDate`: string (yyyy-MM-dd)

Items in returned array have properties:
 - `programID`: string
 - `orchestra`: string
 - `season`: string
 - `concerts`: array of objects with properties:
   - `eventType`: string
   - `location`: string
   - `venue`: string
   - `date`: string (yyyy-MM-dd)
   - `time`: string (like 8:00PM)

#### GET /programs/{programID}
Returns all info on the specified program

Returned object has properties:
 - `programID`: string
 - `orchestra`: string
 - `season`: string
 - `concerts`: array of objects with properties:
   - `eventType`: string
   - `location`: string
   - `venue`: string
   - `date`: string (yyyy-MM-dd)
   - `time`: string (like 8:00PM)
 - `works`: array of objects with properties:
   - `workID`: string
   - `composerName`: string
   - `workTitle`: string
   - `movement`: string (optional)
   - `conductor`: string (optional)
   - `soloists`: (possibly empty) array of objects with properties:
     - `soloistName`: string
     - `soloistInstrument`: string
     - `soloistRoles`: string

#### GET /works
Returns an array of all works and performances of them that match the given criteria

Query Paramters (optional):
 - `startDate`: string (yyyy-MM-dd)
 - `endDate`: string (yyyy-MM-dd)
 - `composerName`: string

Items in returned array have properties:
 - `workID`: string
 - `composerName`: string
 - `workTitle`: string
 - `movement`: string (optional)
 - `programs`: array of strings
 - `numPerformances`: integer

#### GET /works/{workID}
Returns the specified work and performances of it that match the given criteria

Query Parameters (optional):
 - `startDate`: string (yyyy-MM-dd)
 - `endDate`: string (yyyy-MM-dd)

Returned object has properties:
 - `workID`: string
 - `composerName`: string
 - `workTitle`: string
 - `movement`: string (optional)
 - `programs`: array of strings
 - `numPerformances`: integer

## Interface Usage

The interface is not yet available.
const express = require('express')
const config = require('./config.js')

const app = express()
app.use(express.json())

const url = 'https://github.com/nyphilarchive/PerformanceHistory/raw/main/Programs/json/complete.json'

// ===================================================================================================
// HELPER FUNCTIONS
// ===================================================================================================

// returns true if date1 is before date2, false otherwise
const isBefore = (date1, date2) => {
    if (date1.slice(0, 4) < date2.slice(0, 4)) {
        return true
    } else if (date1.slice(0, 4) > date2.slice(0, 4)) {
        return false
    } else if (date1.slice(5, 7) < date2.slice(5, 7)) {
        return true
    } else if (date1.slice(5, 7) > date2.slice(5, 7)) {
        return false
    } else if (date1.slice(8, 10) < date2.slice(8, 10)) {
        return true
    } else if (date1.slice(8, 10) > date2.slice(8, 10)) {
        return false
    }
    return false
}

// returns true if date1 is after date2, false otherwise
const isAfter = (date1, date2) => {
    return isBefore(date2, date1)
}

// cleans JSON data from github call
const cleanData = (programs) => {
    programs.forEach((program) => {
        delete program.id;
        if (program.orchestra === "None") {
            program.orchestra = "Unknown"
        }
        // rename work's ID to workID
        program.works.forEach((work) => {
            work.workID = work.ID
            delete work.ID
        })
        // correct values for concert fields
        program.concerts.forEach((concert) => {
            if (concert.eventType === "None") {
                concert.eventType = "Unknown"
            }
            if (concert.Location === "None") {
                concert.location = "Unknown"
            } else {
                concert.location = concert.Location
            }
            delete concert.Location
            if (concert.Venue === "None") {
                concert.venue = "Unknown"
            } else {
                concert.venue = concert.Venue
            }
            delete concert.Venue
            concert.date = concert.Date.slice(0, 10)
            delete concert.Date
            if (concert.Time === "None") {
                concert.time = "Unknown"
            } else {
                concert.time = concert.Time
            }
            delete concert.Time
        })
        program.works.forEach((work) => {
            // delete null soloists
            work.soloists = work.soloists.filter((soloist) => {
                return soloist != null
            })
            // expand/rename soloistRole
            work.soloists.forEach((soloist) => {
                if (soloist.soloistRoles === "A") {
                    soloist.soloistRole = "Assisting Artist"
                } else if (soloist.soloistRoles === "S") {
                    soloist.soloistRole = "Soloist"
                } else {
                    soloist.soloistRole = soloist.soloistRoles
                }
                delete soloist.soloistRoles
            })
            // delete no-named soloists
            work.soloists.filter((soloist) => {
                return soloist.soloistName !== ""
            })
        })
    }) 
}

const getWorks = (programs, works) => {
    const workSet = new Set()
    programs.forEach((program => {
        program.works.forEach((work) => {
            if (work.workID !== "0*" && !workSet.has(work.workID)) {
                workSet.add(work.workID)
                works.push({
                    "workID": work.workID,
                    "composerName": work.composerName,
                    "workTitle": work.workTitle,
                    "movement": work.movement,
                    "programs": [program.programID],
                    "numConcerts": program.concerts.length
                })
            } else if (work.workID !== "0*") {
                let thisWork = works.find((w) => {
                    return w.workID === work.workID
                })
                thisWork.programs.push(program.programID)
                thisWork.numConcerts += program.concerts.length
            }
        })
    }))
}

// ===================================================================================================
// SERVER SETUP
// ===================================================================================================

// get dataset from github
console.log("Retrieving data from source...")
let programs;
let works = [];
fetch(url)
    .then(res => res.json())
    .then(data => {
        programs = JSON.parse(JSON.stringify(data.programs).normalize("NFD").replace(/\p{Diacritic}/gu, ""))
    })
    // clean data
    .then(() => {
        cleanData(programs)
        getWorks(programs, works)
        console.log("Data retrieved")
    })

// run server
app.listen(config.PORT, () => {
    console.log("Server listening on PORT:", config.PORT)
})

// ===================================================================================================
// API ENDPOINTS
// ===================================================================================================

// GET /programs
app.get("/programs", (req, res) => {
    console.log("GET /programs - Processing request")
    let data = JSON.parse(JSON.stringify(programs))

    // remove concerts/programs that are out of the date range
    if (req.query.startDate) {
        data.forEach((program) => {
            program.concerts = program.concerts.filter((concert) => !isAfter(req.query.startDate, concert.date))
        })
    }
    if (req.query.endDate) {
        data.forEach((program) => {
            program.concerts = program.concerts.filter((concert) => !isBefore(req.query.endDate, concert.date))
        })
    }
    data = data.filter((program) => {
        return program.concerts.length > 0
    })

    // build response
    data.forEach((program) => {
        delete program.works
    })

    // send response
    res.send(data)
    console.log("GET /programs - Response sent")
})

// GET /programs/{programID}
app.get("/programs/:programID", (req, res) => {
    console.log("GET /programs/" + req.params.programID + " - Processing request")
    res.send(programs.filter((program) => {
        return program.programID === req.params.programID
    })[0])
    console.log("GET /programs/" + req.params.programID + " - Response sent")
})

// GET /works 
app.get("/works", (req, res) => {
    console.log("GET /works - Processing request")
    let data = JSON.parse(JSON.stringify(works))

    // filter on startDate and endDate
    if (req.query.startDate || req.query.endDate) {
        // find all valid programs that fit query param criteria
        let validPrograms = new Set()
        let pcMapping = {}
        programs.forEach((program) => {
            let programConcerts = program.concerts
            if (req.query.startDate) {
                programConcerts = programConcerts.filter((concert) => !isAfter(req.query.startDate, concert.date))
            }
            if (req.query.endDate) {
                programConcerts = programConcerts.filter((concert) => !isBefore(req.query.endDate, concert.date))
            }
            if (programConcerts.length !== 0) {
                validPrograms.add(program.programID)
                pcMapping[program.programID] = program.concerts.length
            }
        })
        // filter works based on validPrograms
        data.forEach((work) => {
            work.programs = work.programs.filter((program) => {
                return validPrograms.has(program)
            })
        })
        data = data.filter((work) => {
            return work.programs.length !== 0
        })
        data.forEach((work) => {
            work.numConcerts = 0
            work.programs.forEach((program) => {
                work.numConcerts += pcMapping[program]
            })
        })
    }

    // filter on composer
    if (req.query.composerName) {
        data = data.filter((work) => {
            if (work.composerName) {
                return work.composerName.replace(/\s/g, '') === req.query.composerName.replace(/\s/g, '')
            } else {
                return false
            }
        })
    }

    res.send(data)
    console.log("GET /works - Response sent")
})

app.get("/works/:workID", (req, res) => {
    // find individual work
    console.log("GET /works/" + req.params.workID + " - Processing request")
    let data = JSON.parse(JSON.stringify(works))
    let work = data.filter((w) => {
        return w.workID === req.params.workID
    })[0]

    // filter on date range
    if (req.query.startDate || req.query.endDate) {
        // find all programs with work
        let programSet = new Set()
        work.programs.forEach((program) => {
            programSet.add(program)
        })
        let workPrograms = programs.filter((program) => {
            return programSet.has(program.programID)
        })
        // filter programs by date
        let validPrograms = new Set()
        let pcMapping = {}
        workPrograms.forEach((program) => {
            let programConcerts = program.concerts
            if (req.query.startDate) {
                programConcerts = programConcerts.filter((concert) => !isAfter(req.query.startDate, concert.date))
            }
            if (req.query.endDate) {
                programConcerts = programConcerts.filter((concert) => !isBefore(req.query.endDate, concert.date))
            }
            if (programConcerts.length !== 0) {
                validPrograms.add(program.programID)
                pcMapping[program.programID] = program.concerts.length
            }
        })
        // remove programs out of date range
        work.programs = work.programs.filter((program) => {
            return validPrograms.has(program)
        })
        // update numConcerts
        work.numConcerts = 0
        work.programs.forEach((program) => {
            work.numConcerts += pcMapping[program]
        })
    }
    res.send(work)
    console.log("GET /works/" + req.params.workID + " - Response sent")
})
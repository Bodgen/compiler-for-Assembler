import fs from 'fs'
import parseString from "./LexicalAnalyser/Parser.js";
import getDataForListing from "./ListingCreation/DataProcessing.js";

let stringsList = []
new Promise((resolve, reject) => {
        fs.readFile('file.asm', (e, data) => {
            if (data) {
                const dividedData = data.toString().split('\n')
                for (const string of dividedData) {
                    stringsList.push(parseString(string))
                }
                resolve()
            } else {
                reject('Some error was occurred')
                throw e
            }
        })
    }
).then(() => {
    fs.writeFile('test.lst', getDataForListing(stringsList), (e) => {
        if (e) throw e
    })
})



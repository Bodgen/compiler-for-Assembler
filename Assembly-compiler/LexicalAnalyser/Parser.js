import {findOperands, indexOfType} from "./Search.js";
import defineCommandType, {t, isMnemocode} from "./Type.js";
import printTable from "./Output.js";
import splitString from "./Split.js";
import common from '../ListingCreation/Common.js'

const checkOnUpperCase = (command, str) => {
    const re = new RegExp(command, 'i');
    return str.match(re)[0].match(/^[A-Z]+\d*$/g)
}


export default function parseString(str) {
    let error = false, errorContent = ''
    let userIdentifier = ''
    const commandsList = splitString(str)
    if (commandsList !== str) {
        const operands = findOperands(commandsList)

        //If it was any command after the directive which must not contain any operands
        if (operands[0] === t.errorOfOperand) {
            printTable(str, null, null, null, true, operands[1], t.errorOfOperand)
            return {
                sourceString: str,
                isUseful: true,
                error: true,
                errorContent: operands[1],
                errorText: `${operands[0]} ${operands[1] ? ': ' + operands[1] : ''}`
            }
        }
        //If it was only one sign at the beginning of the string
        if (commandsList[0].length === 1 && !commandsList[0].match(/[a-z]/i)) {
            printTable(str, null, null, null, true, commandsList[0], t.undef)
            return {
                sourceString: str,
                isUseful: true,
                error: true,
                errorContent: commandsList,
                errorText: `${t.undef}${operands[1]}`
            }
        }


        let res = []
        let i = 0
        for (const command of commandsList) {
            let type = defineCommandType(command)
            /**If user identifier contains small letters*/
            if (type === t.userIdentifier && !checkOnUpperCase(command, str)) {
                errorContent = 'Ідентифікатор містить недопустимі символи'
                error = true
                break
            }
            //If there were two commands with the same type one by one
            if (type === res[i - 1]?.Type && type !== t.char && (commandsList[i+1] !== '[')) {
                type = t.undef
            }

            if (type === t.userIdentifier) userIdentifier = command

            const isMnemonic = isMnemocode(command)
            if (type !== t.undef) {
                res.push({
                    No: i,
                    Lexem: command,
                    Length: command.length,
                    Type: type,
                    isMnemo: isMnemonic
                })
                i++
            } else {
                //If there was undefined command or any error
                errorContent = command
                error = true
                break
            }
        }
        if (res[0]?.Type === t.userIdentifier && !common.hasIdentifier(res[0].Lexem)) common.setNewUserIdentifier(res[0].Lexem)

        printTable(str, res, operands, indexOfType(t.mnemo, commandsList), error, errorContent)
        return {
            sourceString: str,
            parsedString: res,
            isUseful: true,
            error,
            errorContent,
            errorText: error ? `${t.undef} : ${errorContent}` : '',
            operands,
            mnemocode: res[indexOfType(t.mnemo, commandsList)],
            label: res[0]?.Type === t.userIdentifier ? res[0] : {},
            isMark: res[1]?.Lexem === ':',
            userIdentifier
        }
    } else {
        //If there was Not any useful commands
        //console.log(str)
        return {
            sourceString: str,
            isUseful: false
        }
    }
}
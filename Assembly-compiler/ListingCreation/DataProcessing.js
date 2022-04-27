import firstPassage from "./FirstPassage.js";
import {commonTitle, customErrorMsg, getCommonInfo} from "./Pattern.js";
import secondPassage from "./SecondPassage.js";
import common from "./Common.js";
import {t} from "../LexicalAnalyser/Type.js";

let newData = []

const handleMacro = (info, index, line) => {
    const macInfo = common.getMacroInfo(line.label.Lexem, line.operands?.operand1?.operandName)
    if(!macInfo?.data) return {out:customErrorMsg(line,index,t.unclosedMacro),index:index+1,error:true}
    let out = ''
    let e = false
    let newLine
    newData.push(line)
    macInfo.data.forEach(item => {
        newLine = JSON.parse(JSON.stringify(item))
        if (info.operand) {
            if (newLine?.operands?.operand1?.operandName === macInfo?.operand) {
                newLine.sourceString = newLine.sourceString.replace(newLine.operands.operand1.operandName, info.operand)
                newLine.operands.operand1.operandName = info.operand
            }
            if (newLine?.operands?.operand2?.operandName === macInfo?.operand) {
                newLine.sourceString = newLine.sourceString.replace(newLine.operands.operand2.operandName, info.operand)
                newLine.operands.operand2.operandName = info.operand
            }
        }
         newLine.isMacroLine = true
        const res = firstPassage(newLine, ++index)
        newLine.error = false

        newData.push(newLine)
        out += res.str
        newLine.displacement = res.prevDisplacement
    })
    return {out, index, e}
}

export default function getDataForListing(data) {
    //строка вывода
    let outputData = ''
    /**Processing each parsed line*/

    /**First passage*/
    let index = 0, endCount = 0
    for (const line of data) {
        //получаем каждую строку с розпарсеной даты
        const info = firstPassage(line, index)
        // инфо обьект
        if (info.hasMacro) {

            line.displacement = info.prevDisplacement
            //обработка макроса,заміняєм операнди (якщо вони є)
            const tmp = handleMacro(info, index, line)
            if (!tmp.e) {
               // outputData += info.str
            }
           // outputData += tmp.out
            index = tmp.index
        } else
           // outputData += info.str

        if (info.end) {
            newData.push(line)
            break
        }

        if (info.prevDisplacement >= 0)
            line.displacement = info.prevDisplacement
        else
            line.error = info.str

        if (!info.hasMacro)
            newData.push(line)
        index++

    }
    endCount = index
    index = 0
     outputData += '\n' + commonTitle(2)
    /**Second passage*/
     for (const line of newData) {
         outputData += secondPassage(line, index, line.displacement, line.error)
         if (endCount <= 0) break
         index++
        endCount--
     }

    outputData += getCommonInfo()
    return outputData

}
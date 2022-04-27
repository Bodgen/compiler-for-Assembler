import {addF, addNulls, customErrorMsg, sourceString, successString} from "./Pattern.js";
import {isBeginOfSegment, isEndOfProgramme, isEndOfSegment, isVarDeclaration} from "./FirstPassage.js";
import common from './Common.js'
import {t} from "../LexicalAnalyser/Type.js";
import * as Commands from './State/Instructions.js'
import {isEndOfMacro} from "./FirstPassage.js";
import {isTextConstant} from "../LexicalAnalyser/Type.js";
import {getImmCapacity} from "./Size.js";


export default function secondPassage(line, index, displacement, error) {
    try {
        if (error) return error
        if (!line?.isUseful || isEndOfProgramme(line)) return sourceString(line, index)
        if (isBeginOfSegment(line)) {
            common.setCurrentSegment(line.label.Lexem)
            return successString(line, index, displacement, ' ')
        }
        if (isEndOfSegment(line)) return successString(line, index, displacement, ' ')

        /***Macros handler*/
        //If there is a macro definition
        if (line?.mnemocode?.Lexem === 'MACRO') {
            const macroName = line.label.Lexem
            common.setCurrentMacro(macroName)
            return sourceString(line, index)
        }
        /**If it is the end of macro*/
        if (isEndOfMacro(line)) {
            common.setCurrentMacro('')
            return sourceString(line, index)
        }
        //If it is reference on macro
        if (common.hasMacro(line?.label?.Lexem)) {
            return sourceString(line, index)
        }

        if (common.currentMacro !== '') {
            return sourceString(line, index)
        }


        if (isVarDeclaration(line)) {
            const varInfo = common.getVarInfo(line.label.Lexem)
            let size = varInfo.value
            if(size==='180')size='80'
            const immCapacity =  getImmCapacity(size,t.hex)
            if (immCapacity > varInfo.capacity  && !line.operands.operand1.operandName.includes('\'')) return customErrorMsg(line, index, t.tooBigOperand, varInfo.name)

            if (line.operands.operand1.operandName[0] === '-' && varInfo.capacity !== 1) {
                size = size.toString().slice(1)
                size = addF(size.trimLeft(), varInfo.capacity * 2)
            } else
                size = addNulls(size, varInfo.capacity * 2)
            return successString(line, index, displacement, size)
        }
        //Label handling
        if (line.isMark)
            return successString(line, index, displacement)

        //Mnemocode handling
        const name = line?.mnemocode?.Lexem
        const opCode = Commands[name]?.getOperationCode(line?.operands,line?.isMacroLine,line.displacement)
        if (!opCode) return customErrorMsg(line, index, t.errorOfOperand)
        return successString(line, index, displacement, opCode)


    } catch (e) {
        console.error(e)
    }
}
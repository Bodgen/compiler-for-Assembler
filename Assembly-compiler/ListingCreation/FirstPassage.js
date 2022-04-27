import {t} from "../LexicalAnalyser/Type.js";
import {
    currentDisplacementWithCommandSizeStr,
    customErrorMsg,
    endOfSegmentStr,
    nullDisplacementString,
    sourceString
} from "./Pattern.js";
import common from './Common.js'
import {defineVariableSize, operandsCalc} from "./Size.js";
import * as Commands from './State/Instructions.js'

export const isBeginOfSegment = line => line?.mnemocode?.Lexem === 'SEGMENT'
export const isEndOfSegment = line => line?.mnemocode?.Lexem === 'ENDS'
export const isEndOfMacro = line => line?.mnemocode?.Lexem === 'ENDM'
export const isEndOfProgramme = line => line.sourceString.trim().toUpperCase() === 'END'
export const isVarDeclaration = line => line?.mnemocode?.Lexem === 'DB' || line?.mnemocode?.Lexem === 'DW' || line?.mnemocode?.Lexem === 'DD'


function handleErrors(line, index) {
    /**Errors handling**/
    if (line.errorText)
        return customErrorMsg(line, index, line.errorText)

    /**If there was a duplication of some user identifiers*/
    if (common.identifiers[line?.label?.Lexem]?.wasPassed)
        return customErrorMsg(line, index, t.userIdentifierDuplication, line?.label.Lexem)

    /**If there was an undefined reference to some label or variable*/
    if (line.userIdentifier
        && line.userIdentifier !== line?.label?.Lexem
        && !common.hasIdentifier(line?.userIdentifier)
        && !common.hasMacro(line?.label?.Lexem)
        && common.getMacroInfo(common.currentMacro)?.operand !== line?.userIdentifier
        && !common.hasMacroOperandDeclaration(line?.userIdentifier)
    )
        return customErrorMsg(line, index, t.undefinedReference, line.userIdentifier)

    return false
}


export default function firstPassage(line, index) {
    try {
        let prevDisplacement = common.currentDisplacement
        let out = handleErrors(line, index)
        if (out) return {str: out}

        if (isEndOfProgramme(line)) {
            if (common.currentSegment !== '')
                return {str: customErrorMsg(line, index, t.unclosedSegment, common.currentSegment), end: true}

            return {str: sourceString(line, index), end: true}
        }


        /***Macros handler*/
        //If there is a macro definition
        if (line?.mnemocode?.Lexem === 'MACRO') {
            if(common.currentMacro !== '')
                return {str: customErrorMsg(line,index,t.unclosedMacro,common.currentMacro),error:true,hasMacro: false}
            const macroName = line.label.Lexem
            common.setMacroInfo(macroName, line?.operands?.operand1?.operandName)
            common.setCurrentMacro(macroName)
            return {str: sourceString(line, index)}
        }
        /**If it is the end of macro*/
        if (isEndOfMacro(line)) {
            common.setCurrentMacro('')
            return {str: sourceString(line, index)}
        }
        //If it is reference on macro
        if (common.hasMacro(line?.label?.Lexem)) {
            const macInfo = common.getMacroInfo(line.label.Lexem)
            if(!!line?.parsedString[1]?.Lexem === !!macInfo.hasOperand)
                return {str: sourceString(line, index), hasMacro: true, operand: line?.operands?.operand1?.operandName}

            else return {str: customErrorMsg(line,index,t.errorOfOperand)}
        }

        if (common.currentMacro !== '' && !isBeginOfSegment(line)) {
            common.addMacroInfo(line)
            return {str: sourceString(line, index)}
        }


        /**If there wasn`t any useful commands in the line or it is the end of programme**/
        if (!line.isUseful)
            return {str: sourceString(line, index), prevDisplacement: ''}

        /**If there was some useful commands in line**/

        //If it is the begin of the data or code segment
        if (isBeginOfSegment(line)) {
            if (common.currentSegment !== '') return {str: customErrorMsg(line, index, t.unclosedSegment, common.currentSegment),error:true}
            if(common.currentMacro !== '') return {str: customErrorMsg(line,index,t.unclosedMacro,common.currentMacro),error:true}
            common.nullifyDisplacement()
            common.setCurrentSegment(line.label.Lexem)
            common.setIsSegmentName(line.label.Lexem)
            return {str: nullDisplacementString(line, index), prevDisplacement}
        }

        //If it is the end of data or code segment
        if (isEndOfSegment(line)) {
            out = endOfSegmentStr(line, index)
            common.setSegmentSize(line.label.Lexem)
            common.nullifyDisplacement()
            common.nullifySegment()
            return {str: out, prevDisplacement}
        }


        //If the line contains only mark
        if (line.isMark) {
            common.updateIdentifierInfo(line.label.Lexem)
            common.setIsLabel(line.label.Lexem)
            return {str: currentDisplacementWithCommandSizeStr(line, index, ''), prevDisplacement}
        }


        //If there is some code away from code or data segment
        if (common.currentSegment === '' && line?.mnemocode?.Lexem !== 'MACRO')
            return {str: customErrorMsg(line, index, t.outOfSegmentCommand)}


        //If it is declaration of variable
        if (isVarDeclaration(line)) {
            let operandsSize = ''
            if (line.parsedString[2].Type === t.textConstant) {
                if (line.mnemocode.Lexem === 'DB') {
                    const re = new RegExp(line.operands.operand1.operandName, 'i')
                    const opName = line.sourceString.match(re)[0]
                    operandsSize = operandsCalc({operand1: {operandName: opName}})
                } else {
                    return {str:customErrorMsg(line, index, t.errorOfOperand, 'Текстова константа використовується тільки з типом даних BYTE')}
                }
            } else
                operandsSize = operandsCalc(line.operands)
            const varName = line.label.Lexem
            const varSize = defineVariableSize(line.mnemocode.Lexem, line.operands.operand1.operandName)

            if (line?.mnemocode?.Lexem === 'DB')
                common.setIsVar(varName, 1)
            else
                common.setIsVar(varName, varSize)

            common.setNewVariable(varName, varSize, operandsSize, line.mnemocode.Lexem)
            common.updateIdentifierInfo(varName)

            out = currentDisplacementWithCommandSizeStr(line, index, varSize)
            common.addSizeToDisplacement(varSize)

            return {str: out, prevDisplacement}
        }

        //Normal
        if (line?.mnemocode?.Type === t.instruction) {
            const mnemo = line.mnemocode.Lexem
            const mnemoSize = Commands[mnemo].getSize(line?.operands,line?.isMacroLine)

            if (mnemoSize !== t.errorOfOperand && mnemoSize !== t.incompatibleOperands) {
                out = {str: currentDisplacementWithCommandSizeStr(line, index, mnemoSize), prevDisplacement}
                common.addSizeToDisplacement(mnemoSize)
            } else
                out = {str: customErrorMsg(line, index, mnemoSize)}

            return out
        }

    } catch (e) {
        console.error(e)
    }
    return {str: customErrorMsg(line, index, 'Невизначена помилка')}
}

import {
    eightBitRegisters,
    is16bitReg,
    is8bitReg,
    isMem,
    isTextConstant,
    t,
    toFixStringWithValidNumberInside,
    toHEXStr
} from "../LexicalAnalyser/Type.js";
import splitString from "../LexicalAnalyser/Split.js";
import {addNulls} from "./Pattern.js";
import {sixteenBitRegisters} from "../LexicalAnalyser/Type.js";
import common from "./Common.js";
import {addF} from "./Pattern.js";
import defineCommandType from "../LexicalAnalyser/Type.js";


export const getMemNumber = operand => {
    let num = splitString(operand)
    return +num[num.length - 2]
}
export const memCapacity = (operand, op2) => {

}
export const has16bitDataInBasicAddress = operand => {
    if (operand.includes('BX') && !operand.match(/(DI|SI)/g)) return false
    const openBracketIndex = operand.indexOf('[')
    if (openBracketIndex === -1) return t.errorOfOperand
    let operandAddress = operand.slice(openBracketIndex + 1, operand.length - 1)
    operandAddress = splitString(operandAddress)

    for (const el of operandAddress) {
        if (el !== '+' && el !== '-') {
            if (!is16bitReg(el) && !Number.isInteger(+el) || el === 'AX' || el === 'CX' || el === 'DX') return false
        }
    }
    return true
}


export function defineVariableSize(mnemo, operand) {
    switch (mnemo) {
        case'DB':
            if (isTextConstant(operand)) return operand.length - 2
            return 1
        case 'DW':
            return 2
        case 'DD':
            return 4
    }
}


export function operandsCalc(operands) {
    const operand = operands?.operand1 || operands
    if (operand.operandName.charAt(0) === '\'') {
        //calc text constant value
        const op = operand.operandName.replaceAll('\'', '').trim()
        let res = ''
        for (let i = 0; i < op.length; i++) {
            res += op.charCodeAt(i).toString(16).toUpperCase() + ' '
        }
        return res
    }
    if (operand.value) return toHEXStr(operand.value)
    if (operand) {
        if (operand.length <= 2) {
            if (operand.operandName[0] === '-') {
                const num = +operand.operandName.replace(' ', '').trim()
                return calcNegativeNumber(num)
            }
            return toHEXStr(toFixStringWithValidNumberInside(operand.operandName))
        } else {
            const tmp = splitString(operand.operandName)
            let task = ''
            for (const el of tmp) {
                if (!el.match(/[+-/*]/i)) {
                    task += toFixStringWithValidNumberInside(el)
                } else task += el
            }
            return toHEXStr(eval(task))
        }
    }
    return -1
}

export const calcNegativeNumber = (num) => {
    let res = (+num).toString(2)
    if (res.length < 8) res = addNulls(res, 8)
    res = res.split('').map(i => +(!(+i))).join('')
    return (~Number.parseInt(res, 2)).toString(16).replace('-', '').trim().toUpperCase()
}

export const calcCommandCode = (mainOperand, commandReg, varDisplacer) => {
 if (isMem(mainOperand)) {
        let [reg1, , base, , num] = splitString(mainOperand.slice(mainOperand.indexOf('[') + 1))
        let varDisp = varDisplacer
        if (common.hasVariable(varDisp)) {
            varDisp = common.getVarInfo(varDisplacer).displacement
        }
        let reg
        if (typeof commandReg === 'number') {
            reg = commandReg
        } else {
            let tmp = sixteenBitRegisters.indexOf(commandReg)
            if (tmp === -1) tmp = eightBitRegisters.indexOf(commandReg)
            reg = addNulls(tmp.toString(2), 3)
        }

        let res = ''
        let modRm

        let Mod = 0b10
        if (!varDisp && varDisp !== 0)
            Mod = 0b01

        let rm = 0b0
        if (mainOperand.includes('DI')) rm = 0b1
        if(mainOperand.includes('BP')) rm = 0b010
         if(mainOperand.includes('BP')&&mainOperand.includes('DI')) rm = 0b011
        modRm = +`0b${addNulls(Mod.toString(2), 2) + addNulls(reg.toString(2), 3) + addNulls(rm.toString(2), 3)}`
        res += modRm.toString(16).toUpperCase() + ' '

        if (varDisp || varDisp === 0) {
            if(!mainOperand.includes('-'))
                res += `${addNulls((varDisp + +num).toString(16).toUpperCase(), 4)}` + 'r'
            else{
                if(varDisp === (+num)){
                    res += `0000r`
                }
                if(varDisp < (+num)){
                    const tmp = calcNegativeNumber(`${(+toFixStringWithValidNumberInside((varDisp - +num).toString().replace('-','').trim()))}`)
                    res += `${addF(tmp, 4)}` + 'r'
                }
                else{
                    res += `${addNulls((varDisp - +num).toString(16).toUpperCase(), 4)}` + 'r'
                }
            }
        } else {
            res += `${addNulls((+num).toString(16), 2).toUpperCase()}`
        }
        return res
    }

}
export const createModRm = (mod, reg, rm) => {
    /**mod - bin
     * reg - str
     * rm-bin or str
     */
    let r = reg.toString(2)
    if (is16bitReg(reg))
        r = addNulls(sixteenBitRegisters.indexOf(reg).toString(2), 3)
    if (is16bitReg(rm))
        rm = addNulls(sixteenBitRegisters.indexOf(rm).toString(2), 3)
    if (is8bitReg(reg))
        r = addNulls(eightBitRegisters.indexOf(reg).toString(2), 3)
    if (is8bitReg(rm))
        rm = addNulls(eightBitRegisters.indexOf(rm).toString(2), 3)
    return (+`0b${mod.toString(2) + r + rm.toString(2)}`).toString(16).toUpperCase()
}
export const getImmCapacity = (operand,TYPE) => {
    /***operand - str*/

    let tmp = operand.replace('-', '').trim()
    let type = defineCommandType(tmp)
    if((type !== t.decimal && type !== t.hex && type !== t.binary) || TYPE) type = TYPE
    let a
    a = +toFixStringWithValidNumberInside(tmp,type)
    if(operand==='180')a=80
    if (operand.match(/-/gi)) {
        if (a <= 130) return 1
        if (a <= 32768) return 2
        return 4
    } else {
        if (a <= 255) return 1
        if (a <= 65535) return 2
        return 4
    }

}


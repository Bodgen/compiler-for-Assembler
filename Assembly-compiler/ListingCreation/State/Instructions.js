import * as Regs from './SegRegisters.js'
import common from '../Common.js'
import {
    eightBitRegisters,
    getRegType,
    getReplacer,
    getVariableDisplacer,
    hasSegmentReplacement,
    is16bitReg,
    is8bitReg,
    isImm,
    isMem,
    sixteenBitRegisters,
    t,
    toFixStringWithValidNumberInside
} from "../../LexicalAnalyser/Type.js";
import {
    calcCommandCode,
    calcNegativeNumber,
    createModRm,
    getImmCapacity,
    getMemNumber,
    has16bitDataInBasicAddress,
    operandsCalc
} from "../Size.js";
import {addNulls, addF} from "../Pattern.js";

const hasAutoReplacement = (variable, operand) => common.getVarInfo(variable).segment === common.currentSegment && !operand.includes(':')
const calcImm = (operand, immCapacity) => {
    let addSigns = immCapacity === 1 ? 2 : 4
    if (operand.match(/-/g)) {
        return addF(calcNegativeNumber(toFixStringWithValidNumberInside(operand.replace('-', '').trim())), addSigns)
    } else {
        return addNulls(operandsCalc({operand1: {operandName: operand}}), addSigns)
    }
}

export const CLC = {
    name: 'CLC',
    getSize() {
        return 0x1
    },
    getOperationCode() {
        return 'F8'
    },
}
export const POP = {
    name: 'POP',
    getSize() {
        return 0x1
    },
    getOperationCode(operand) {
        const opName = operand.operand1.operandName
        let opCode = 0x58
        const opType = is16bitReg(opName)
        if (opType) {
            const i = Number.parseInt(sixteenBitRegisters.indexOf(opName), 16)
            opCode += i
            return opCode.toString(16).toUpperCase()
        }
    },
}
export const DIV = {
    /**++++++++++++++++++*/
    name: 'DIV',
    getSize(operand, isMacroLine) {
        const opName = operand.operand1.operandName
        const varDisplacer = getVariableDisplacer(opName)
        if (!isMem(opName) || !has16bitDataInBasicAddress(opName) || !varDisplacer) return t.errorOfOperand
        if (hasAutoReplacement(varDisplacer, opName) || hasSegmentReplacement(opName) || isMacroLine) return 0x5
        return 0x4
    },
    getOperationCode(operand, isMacroLine) {
        const opName = operand.operand1.operandName
        let opCode = ''
        const varDisplacer = getVariableDisplacer(opName)
        const varDisplacement = common.getVarInfo(varDisplacer).displacement
        const varDisplacerType = common.getVarInfo(varDisplacer).mnemo
        let replacer = hasSegmentReplacement(opName) && getReplacer(opName)
        if (!replacer &&isMacroLine) replacer = 'DS'
        if (hasAutoReplacement(varDisplacer, opName)) replacer = 'CS'
        opCode += replacer ? `${Regs[replacer]?.prefix.toString(16).toUpperCase()} : ` : ''
        if (varDisplacerType === 'DW') opCode += 'F7 '
        if (varDisplacerType === 'DB') opCode += 'F6 '
        opCode += calcCommandCode(opName, 6, varDisplacement)
        return opCode
    }
}

export const AND = {
    /**++++++++++++*/
    name: 'AND',
    getSize(operands, isMacroLine) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        const op1Type = getRegType(opName1)
        const op2Type = isMem(opName2)
        const varDisplacer = getVariableDisplacer(opName2)
        if (!op1Type || !op2Type || !varDisplacer) return t.errorOfOperand

        const varDisplacerType = common.getVarInfo(varDisplacer).mnemo
        const areCompatible = (op1Type === t.sixteenBitCommonRegister && varDisplacerType === 'DW') || (op1Type === t.eightBitRegister && varDisplacerType === 'DB')
        const isValid = has16bitDataInBasicAddress(opName2) && areCompatible
        if (isValid) {
            if (hasSegmentReplacement(opName2) || hasAutoReplacement(varDisplacer, opName2) || isMacroLine) return 0x5
            return 0x4
        }
        return t.incompatibleOperands
    },
    getOperationCode(operands, isMacroLine) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        const op1Type = getRegType(opName1)
        const op2Type = isMem(opName2)
        const varDisplacer = getVariableDisplacer(opName2)
        if (!op1Type || !op2Type || !varDisplacer) return null
        let replacer = hasSegmentReplacement(opName2) && getReplacer(opName2)
        let opCode = ''
        if (isMacroLine && !replacer) {
            replacer = 'DS'
        }
        if (hasAutoReplacement(varDisplacer, opName2)) replacer = 'CS'
        opCode += replacer ? `${Regs[replacer]?.prefix.toString(16).toUpperCase()} : ` : ''
        if (op1Type === t.eightBitRegister)
            opCode += '22 ' + calcCommandCode(opName2, opName1, varDisplacer)
        else if (op1Type === t.sixteenBitCommonRegister)
            opCode += '23 ' + calcCommandCode(opName2, opName1, varDisplacer)
        return opCode
    }
}
export const CMP = {
    /**++++++++++++*/
    name: 'CMP',
    getSize(operands, isMacroLine) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        const op1Type = isMem(opName1)
        const op2Type = getRegType(opName2)
        const varDisplacer = getVariableDisplacer(opName1)
        if (!op1Type || !op2Type || !varDisplacer) return t.errorOfOperand
        const varDisplacerType = common.getVarInfo(varDisplacer).mnemo
        const areCompatible = (op2Type === t.sixteenBitCommonRegister && varDisplacerType === 'DW') || (op2Type === t.eightBitRegister && varDisplacerType === 'DB')
        const isValid = has16bitDataInBasicAddress(opName1) && areCompatible
        if (isValid) {

            if (hasSegmentReplacement(opName1) || hasAutoReplacement(varDisplacer, opName1) || isMacroLine) return 0x5
            return 0x4
        }
        return t.incompatibleOperands
    },
    getOperationCode(operands, isMacroLine) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        const op1Type = isMem(opName1)
        const op2Type = getRegType(opName2)
        const varDisplacer = getVariableDisplacer(opName1)
        if (!op1Type || !op2Type || !varDisplacer) return null
        let replacer = hasSegmentReplacement(opName1) && getReplacer(opName1)
        let opCode = ''
        if (!replacer &&isMacroLine) replacer = 'DS'
        if (hasAutoReplacement(varDisplacer, opName1)) replacer = 'CS'
        opCode += replacer ? `${Regs[replacer]?.prefix.toString(16).toUpperCase()} : ` : ''
        if (op2Type === t.eightBitRegister)
            opCode += '38 ' + calcCommandCode(opName1, opName2, varDisplacer)
        else if (op2Type === t.sixteenBitCommonRegister)
            opCode += '39 ' + calcCommandCode(opName1, opName2, varDisplacer)
        return opCode
    }
}

export const OR = {
    /**++++++++++++*/
    name: 'OR',
    getSize(operands, isMacroLine) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        const op1Type = isMem(opName1)
        const op2Type = isImm(opName2)
        const varDisplacer = getVariableDisplacer(opName1)
        if (!op1Type || !op2Type || !varDisplacer) return t.errorOfOperand
        const isValid = has16bitDataInBasicAddress(opName1)
        if (isValid) {
            // const memNum = getMemNumber(opName1)
            let additionalBytes = 0x0

            const op2Num = +toFixStringWithValidNumberInside(opName2)
            if (op2Num > 16) additionalBytes += 0x1

            if (hasSegmentReplacement(opName1) || hasAutoReplacement(varDisplacer, opName1) || isMacroLine) {
                return 0x6 + additionalBytes
            }
            return 0x5 + additionalBytes
        }
        return t.incompatibleOperands
    },
    getOperationCode(operands, isMacroLine) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        const op1Type = isMem(opName1)
        const op2Type = isImm(opName2)
        const varDisplacer = getVariableDisplacer(opName1)
        if (!op1Type || !op2Type || !varDisplacer) return null

        let replacer = hasSegmentReplacement(opName1) && getReplacer(opName1)
        let varDisplacerType,
            immCapacity = getImmCapacity(opName2)
        if (immCapacity === 4) return null
        if (varDisplacer) varDisplacerType = common.getVarInfo(varDisplacer).capacity
        if (varDisplacerType < immCapacity) return null
        let opCode = ''
        if (!replacer &&isMacroLine) {
            replacer = 'DS'
        }
        if (hasAutoReplacement(varDisplacer, opName1)) replacer = 'CS'
        opCode += replacer ? `${Regs[replacer]?.prefix.toString(16).toUpperCase()} : ` : ''

        if (varDisplacerType === 1 && immCapacity === 1) {
            opCode += '80 '
        } else if (varDisplacerType === 2 && immCapacity === 2) {
            opCode += '81 '
        } else if (varDisplacerType === 2 && immCapacity === 1) {
            opCode += '83 '
        }
        opCode += calcCommandCode(opName1, 0b1, varDisplacer)
        return opCode + ' ' + calcImm(opName2, varDisplacerType)
    }
}
export const MOV = {
    /**+++++++++++++++++++++++++++++++*/
    name: 'MOV',
    getSize(operands) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        const op1Type = getRegType(opName1)
        const op2Type = isImm(opName2)
        const immCapacity = op2Type && getImmCapacity(opName2)
        const areCompatible = (op1Type === t.sixteenBitCommonRegister && immCapacity !== 4)
            || (op1Type === t.eightBitRegister && immCapacity === 1)
        if (!areCompatible) return t.incompatibleOperands

        if (!op1Type || !op2Type) return t.errorOfOperand
        if (op1Type === t.eightBitRegister) return 0x2
        if (op1Type === t.sixteenBitCommonRegister) return 0x3

        return t.errorOfOperand
    },
    getOperationCode(operands) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        const op1Type = getRegType(opName1)

        let opCode = '',addSignsAmount
        if (is16bitReg(opName1)) {
            opCode += (0xB8 + +sixteenBitRegisters.indexOf(opName1)).toString(16).toUpperCase()
            addSignsAmount = 4
        }
        if (op1Type === t.eightBitRegister) {
            opCode += (0xB0 + +eightBitRegisters.indexOf(opName1)).toString(16).toUpperCase()
            addSignsAmount = 1
        }
        opCode += ' ' + calcImm(opName2, addSignsAmount)
        return opCode
    }
}
export const BT = {
    /**+++++++++*/
    name: 'BT',
    getSize(operands) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        const op1Type = getRegType(opName1)
        const op2Type = getRegType(opName2)
        if (!op1Type || !op2Type) return t.errorOfOperand
        if (op1Type !== op2Type) return t.incompatibleOperands
        return 0x3
    },
    getOperationCode(operands) {
        const opName1 = operands.operand1.operandName
        const opName2 = operands.operand2.operandName
        if (is8bitReg(opName1) || is8bitReg(opName2)) return null
        return '0F A3 ' + createModRm(0b11, opName2, opName1)
    }
}
export const JL = {
    /**++++++++++++*/
    name: 'JL',
    getSize(operand) {
        const opName = operand.operand1.operandName
        if (!common.hasVariable(opName) && common.hasIdentifier(opName)) {
            if (common.identifiers[opName]?.wasPassed) return 0x2
            return 0x4
        }
        return t.errorOfOperand
    },
    getOperationCode(operand, notUseful, commandDisplacement) {
        const opName = operand.operand1.operandName
        if (common.identifiers[opName].segment !== common.currentSegment) return null

        const wasPassed = common.identifiers[opName].displacement <= commandDisplacement
        let opCode = '7C '
        const labelDisplacement = common.identifiers[opName].displacement
        const tmp = (labelDisplacement - (commandDisplacement + 2))
        if (!wasPassed) {
            opCode += addNulls(tmp.toString(16), 2) + ' 90 90'
        } else {
            opCode += addNulls(calcNegativeNumber(tmp), 2)
        }
        return opCode.toUpperCase()
    }
}

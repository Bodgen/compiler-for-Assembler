import defineCommandType, {
    t,
    isDataDirective,
    isInstruction,
    isSizeType,
    isMnemocode,
    isCommandWithNoOperands,
    isCommandWithOneOperand
} from "./Type.js";
import common from "../ListingCreation/Common.js";

export function findOperands(arr) {

    /**If there is only label in the string*/
    if (arr.length === 2 && arr[1] === ':') return [0, 0]


    /**Index of the command without any operands*/
    let indexOfCommandWithoutOperands = indexOfType(t.withoutOperands, arr)
    if (common.hasMacro(arr[0])) {
        if (arr[1])
            return {
                operand1: {
                    operandName: arr.slice(1, arr.length).join(''),
                    position: 1,
                    length: arr.length - 1
                }
            }
        return [0, 0]
    }

    if (indexOfCommandWithoutOperands !== -1 && arr[indexOfCommandWithoutOperands + 1] && arr[1] !== 'MACRO') {
        return [t.errorOfOperand, arr[indexOfCommandWithoutOperands + 1]]
    }

    if (arr[1] === 'MACRO') {
        common.setMacroDefinition(arr[0])
        if (!arr[2])
            return [0, 0]
        return {
            operand1: {
                operandName: arr[2],
                position: 2,
                length: arr.length - 2
            }
        }
    }


    let indexOfCommandWithOneOperand = indexOfType(t.commandWithOneOperand, arr)
    const indexOfComma = arr.indexOf(',')

    /**If there is a command with two operands and they exist*/
    if ((indexOfComma !== -1 && (indexOfComma !== 3 && indexOfComma !== 1) && arr[indexOfComma + 1] && indexOfCommandWithOneOperand === -1)) {
        let indexOfOp1, lengthOfOp1, indexOfOp2, lengthOfOp2
        indexOfOp1 = 1
        lengthOfOp1 = indexOfComma - 1
        indexOfOp2 = indexOfComma + 1
        lengthOfOp2 = arr.length - indexOfComma - 1
        if (defineCommandType(arr[0]) === t.userIdentifier) {
            indexOfOp1 = 3
            lengthOfOp1 = indexOfComma - 3
        }
        return {
            operand1: {
                operandName: lengthOfOp1 > 1 ? arr.slice(indexOfOp1, indexOfComma).join(' ') : arr[indexOfOp1],
                position: indexOfOp1,
                length: lengthOfOp1
            },
            operand2: {
                operandName: lengthOfOp2 > 1 ? arr.slice(indexOfOp2).join(' ') : arr[indexOfOp2],
                position: indexOfOp2,
                length: lengthOfOp2
            },

        }
    }

    /**If there is a command with one operand and it exists*/
    if (indexOfCommandWithOneOperand !== -1 && arr[indexOfCommandWithOneOperand + 1] && indexOfComma === -1) {
        return {
            operand1: {
                operandName: arr.length > 2 ? arr.slice(indexOfCommandWithOneOperand + 1).join(' ') : arr[indexOfCommandWithOneOperand + 1],
                position: indexOfCommandWithOneOperand + 1,
                length: arr.length > 2 ? arr.slice(indexOfCommandWithOneOperand + 1).length : 1
            }
        }
    }

    /**If it was undefined command*/
    if (indexOfCommandWithOneOperand === -1 && indexOfCommandWithoutOperands === -1 && indexOfComma === -1) return [t.undef]

    /**If there was an error in amount of operands*/
    if ((indexOfCommandWithOneOperand === -1 && indexOfCommandWithoutOperands === -1) ||
        (indexOfCommandWithOneOperand !== -1 && (indexOfComma !== -1 || !arr[indexOfCommandWithOneOperand + 1])) ||
        (indexOfComma === 3 || indexOfComma === 1)
    ) {
        return [t.errorOfOperand, 'Некоректна кількість операндів']
    }

    return [0, 0]
}


export function indexOfType(type, collection) {
    let fn
    switch (type) {
        case t.instruction :
            fn = isInstruction
            break
        case t.sizeType :
            fn = isSizeType
            break
        case t.dataDirective :
            fn = isDataDirective
            break
        case t.mnemo :
            fn = isMnemocode
            break
        case t.withoutOperands:
            fn = isCommandWithNoOperands
            break
        case t.commandWithOneOperand:
            fn = isCommandWithOneOperand
            break
        default :
            throw new Error('Invalid type was getting in function indexOfType')
    }
    for (let i = 0; i < collection.length; i++) {
        if (fn(collection[i])) return i
    }
    return -1
}


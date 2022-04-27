export const t = {
    decimal: 'Десяткова константа',
    binary: "Двійкова константа",
    hex: 'Шістнадцяткова константа',
    instruction: 'Інструкція',
    char: 'Один знак',
    userIdentifier: 'Ідентифікатор',
    unclosedMacro:'Незакритий макрос',
    mnemo: 'Мнемокод',
    dataDirective: 'Директива',
    eightBitRegister: '8-бітний регістр',
    sixteenBitCommonRegister: '16-бітний рзп',
    sixteenBitIndexRegister: '16-бітний індексний регістр',
    textConstant: 'Текстова константа',
    macro: 'Визначення макроса',
    segmentRegister: 'Сегментний регістр',
    sizeType: 'Розмірний тип',
    undef: 'Недопустима команда',
    dataType: 'DATA_TYPE',
    dataTypeOperand: 'DATA_TYPE_OPERAND',
    errorOfOperand: 'Помилка операнда',
    variablesDuplication: 'Повторення змінних',
    outOfSegmentCommand: 'Команда за сегментом данних або коду',
    userIdentifierDuplication: 'Повторення ідентифікаторів',
    undefinedReference: 'Невизначене посилання',
    withoutOperands: 'WITHOUT_OPERANDS',
    commandWithOneOperand: 'COMMAND_WITH_ONE_OPERAND',
    incompatibleOperands: 'Операнди несумісні за типом',
    tooBigOperand: 'Операнд занадто великий',
    unclosedSegment: 'Незакритий сегмент',
    mark: 'MARK',
    reg: 'REG',
    mem: 'MEM',
    imm: 'IMM'
}
export const str = {
    binNULLStr: '0000'
}

const instructions = ['CLC', 'POP', 'DIV', 'BT', 'AND', 'CMP', 'MOV', 'OR', 'JL']
export const eightBitRegisters = ['AL', 'CL', 'DL', 'BL', 'AH', 'CH', 'DH', 'BH']
export const sixteenBitRegisters = ['AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI']
const segmentRegisters = ['ES', 'CS', 'SS', 'DS', 'FS', 'GS']
const sizeTypes = ['DB', 'DD', 'DW']
const dataDirectives = ['END', 'ENDS', 'SEGMENT', 'ENDM']
const dataTypes = ['DWORD', 'BYTE']

const commandsWithNoOperands = ['END', 'ENDM', 'ENDS', 'CLC', 'SEGMENT', 'MACRO']
const commandsWithOneOperand = ['POP', 'DIV', 'JL', 'DB', 'DD', 'DW', 'MACRO']

export const isCommandWithOneOperand = exp => commandsWithOneOperand.includes(exp)
export const isCommandWithNoOperands = exp => commandsWithNoOperands.includes(exp)
export const isInstruction = exp => instructions.includes(exp)
export const isDataType = exp => dataTypes.includes(exp)
export const is8bitReg = exp => eightBitRegisters.includes(exp)
export const is16bitReg = exp => sixteenBitRegisters.includes(exp)
export const isSegmentReg = exp => segmentRegisters.includes(exp)
export const isDataDirective = exp => dataDirectives.includes(exp)
export const isSizeType = exp => sizeTypes.includes(exp)
export const isDec = exp => exp.match(/^\d\d*D?$/i)
export const isBin = exp => exp.match(/^[01][01]+B$/i)
export const isHex = exp => exp.match(/^\d[a-f\d]+H$/i)
export const isTextConstant = exp => exp.match(/^'\w+\d*'$/i)
export const isMacroDefinition = exp => exp === 'MACRO'
export const isUserIdentifier = exp => exp.length <= 4 && exp.match(/^[A-Z]/i)
export const isMnemocode = exp => isInstruction(exp) || isDataDirective(exp) || isSizeType(exp) || isMacroDefinition(exp)


export default function defineCommandType(expression) {
    if (isMacroDefinition(expression)) return t.macro
    if (isInstruction(expression)) return t.instruction
    if (isSizeType(expression)) return `${t.sizeType}_${(expression === 'DB' && '1') || (expression === 'DW' && '2') || (expression === 'DD' && '4')} `
    if (isDataType(expression)) return `${t.dataType}_${(expression === 'BYTE' && '1') || (expression === 'DWORD' && '4')}`
    if (isDataDirective(expression)) return t.dataDirective
    if (is8bitReg(expression)) return t.eightBitRegister
    if (is16bitReg(expression)) return expression === 'SI' ? t.sixteenBitIndexRegister : t.sixteenBitCommonRegister
    if (isSegmentReg(expression)) return t.segmentRegister
    if (isDec(expression)) return t.decimal
    if (isBin(expression)) return t.binary
    if (isHex(expression)) return t.hex
    if (isTextConstant(expression)) return t.textConstant
    if (isUserIdentifier(expression)) return t.userIdentifier
    if (expression.length === 1) return t.char
    return t.undef
}
/*For listing*/


export const deleteLastChar = exp => exp.toString().replace(/(D$|H$|B$)/i, '').trim()

/**Returns string with bin or hex number inside,which is valid for using in func eval*/
export const toFixStringWithValidNumberInside = (exp, type) => {
    const str = deleteLastChar(exp)
    if (type === t.binary || isBin(exp.toString())) return `0b${str}`
    if (type === t.hex || isHex(exp.toString())) return `0x${str}`
    return str
}
/**Converts number in hex string*/
export const toHEXStr = number => (+number).toString(16).toUpperCase()

export const hasSegmentReplacement = operand => {
    for (const reg of segmentRegisters)
        if ((operand.includes(reg)
            && (operand.includes('BP') || operand.includes('SP') || reg !== 'DS')
            && ((!operand.includes('SS') && operand[0] !== '[') || operand.includes('SS') && !(operand.includes('BP') || operand.includes('SP'))))
            || (operand.match(/(SP|BP)/g) && operand.match(/(BX|SI|DI)/g) && !operand.match(/SS/g))
        )
            return true
}
export const getVariableDisplacer = operand => {
    const iDots = operand.indexOf(':')
    if (iDots !== -1) {
        if (operand[iDots + 2] !== '[') {
            return operand.slice(iDots + 1, operand.indexOf('[')).trim()
        }
    } else  return operand.slice(0, operand.indexOf('[')).trim()
}

export const getReplacer = operand => {
    const i = operand.indexOf(':')
    let beg=i-3,end=i-1
    if(i<=2 && i!==-1){
        beg = i-2
        end = i
    }
    return i !== -1 ? operand.slice(beg,end) : null
}
export const getRegType = (operand) => {
    if (is8bitReg(operand)) return t.eightBitRegister
    if (is16bitReg(operand)) return t.sixteenBitCommonRegister
}
export const isMem = (operand) => /\[/i.test(operand) && /]$/i.test(operand)

export const isImm = operand => {
    const tmp = operand.replace('-','').trim()
    return isBin(tmp) || isDec(tmp) || isHex(tmp) || /[\d-]+([DHB])$/i.test(operand)
}





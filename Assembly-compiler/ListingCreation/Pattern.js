import {str} from "../LexicalAnalyser/Type.js";
import common from './Common.js'
import {toHEXStr} from "../LexicalAnalyser/Type.js";
import * as SegmentRegs from './State/SegRegisters.js'

const tab = '\t\t'
const errorTab = `${tab}\t`
const shortTab = `\t\t`
const LEN = 12
export const addNulls = (exp, len) => exp.length < len ? `${'0'.repeat((len ?? 4) - exp.length)}${exp}` : exp
export const addF = (exp, len) => exp.length < len ? `${'F'.repeat((len ?? 4) - exp.length)}${exp}` : exp
export const toFixLen = (str, length) => str.length < length ? `${str}${' '.repeat(length - str.length)}` : str

export const commonTitle = (passageNum) => {
    const date = new Date()
    const localTime = `${addNulls(date.getHours() + 1, 2)}:${addNulls(date.getMinutes(), 2)}:${addNulls(date.getSeconds(), 2)}`
    const localDate = `${addNulls(date.getDate(), 2)}/${addNulls(date.getMonth() + 1, 2)}/${date.getFullYear()}`
    const authorName = `Гаращук Богдан KВ-93 Варіант 5`
    return `${authorName}  ${localDate} ${localTime}\n\n${tab}${tab}${passageNum === 1 ? 'Перший' : 'Другий'} Прохід\n\n`
}
export const sourceString = (line, index) => `${tab}${index + 1}${shortTab}${line.sourceString}\n`
export const customErrorMsg = (line, index, msgText, cause) => {
    common.setNewError(index + 1, msgText, cause)
    return `${sourceString(line, index)}${errorTab}Помилка : ${msgText}${cause ? ' : ' + cause : ''}\n\n`
}
export const nullDisplacementString = (line, index) => `${tab}${index + 1}  ${str.binNULLStr}${tab}${line.sourceString}`
export const currentDisplacementWithCommandSizeStr = (line, index, size) => `${tab}${index + 1}  ${addNulls(toHEXStr(common.currentDisplacement),4)}  ${tab}${line.sourceString}`
export const endOfSegmentStr = (line, index) => `${tab}${index + 1}  ${addNulls(toHEXStr(common.currentDisplacement),4)}${tab}${line.sourceString}`
/**Second passage*/
export const successString = (line, index, displacement, opCode) => `${tab}${index + 1} ${addNulls(toHEXStr(displacement),4)}  ${toFixLen(opCode || '', LEN)}${tab}${line.sourceString}\n`

/***Common info*/
const userDefinedSegmentInfo = (name, capacity, size) => `${tab}${name}     ${capacity}    ${addNulls(toHEXStr(size))} \n`
const getUserDefinedSegments = () => {
    let out = `\n\n${tab}  Сегменти дати або коду визначені користувачем\n` + `${tab}Назва     Розрядність    Розмір \n`
    for (const item in common.identifiers) {
        if (common.identifiers.hasOwnProperty(item)) {
            const identifier = common.identifiers[item]
            if (identifier.isSegmentName)
                out += userDefinedSegmentInfo(identifier.name, '16-біт\t\t\t', identifier.size)
        }
    }
    return out
}
const getSegmentRegistersInfo = () => {
    let out = `\n\n${tab}  Інформація про сегментні регістри\n` + `${tab}Назва     Призначення \n`
    for (const item in SegmentRegs) {
        const register = SegmentRegs[item]
        out += `${tab}${register.name}        ${register.getDestiny() ?? 'NOTHING'}\n`
    }
    return out
}


const userIdentifierInfo = (name, type, segment, displacement) => {
    return `${tab}${toFixLen(name, 4)}    ${toFixLen(type, 8)}   ${toFixLen(segment, 4)}${shortTab}${addNulls(toHEXStr(displacement))} \n`
}
const getUserIdentifiersInfo = () => {
    let out = `\n\n${tab}  Користувацькі ідентифікатори\n` + `${tab}Назва     Тип${shortTab}      Зміщення \n`
    for (const item in common.identifiers) {
        if (common.identifiers.hasOwnProperty(item)) {
            const identifier = common.identifiers[item]
            if (identifier.isSegmentName)
                out += userIdentifierInfo(identifier.name, 'SEGMENT', '', identifier.displacement)
            if (identifier.isVar)
                out += userIdentifierInfo(identifier.name, identifier.type, identifier.segment, identifier.displacement)
            if (identifier.isLabel)
                out += userIdentifierInfo(identifier.name, 'LABEL', identifier.segment, identifier.displacement)
            if (identifier.isMacro)
                out += userIdentifierInfo(identifier.name, 'MACRO', '', '')
        }
    }
    return out
}

const getAllErrorsInfo = () => {
    let out = `\n${tab}Помилки :`
    common.errors.forEach(e => {
        out += `\n${tab}Помилка виникла у рядку ${e.lineIndex} : ${e.errorText} ${e.cause ? `: ${e.cause}` : ''}`
    })
    if (!common.errors.length) out += ` Немає\n`
    return out
}
export const getCommonInfo = () => getUserDefinedSegments() + getSegmentRegistersInfo() + getUserIdentifiersInfo() + getAllErrorsInfo()
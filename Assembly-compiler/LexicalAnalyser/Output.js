import {t} from './Type.js'

export default function printTable(string, stringData, operands, mnemoIndex, error, errorContent, errorType = t.undef) {
    if (error) {
        console.log("\x1b[31m", string)
        console.log(errorType + ' : ' + errorContent + '\n')
        console.log("\x1b[0m")
        return
    }
    console.log(string)
    console.table(stringData, ['Lexem', 'Length', 'Type'])
    console.log('-----------------------------------------------------')
    console.log('|  Label  |  Mnemocode  |  Operand 1  |  Operand 2  |')
    console.log('-----------------------------------------------------')
    console.log('|         |             |             |             |')
    console.log(
        //Label
        `|  ${stringData[0].Type === t.userIdentifier
            ? '0   '
            : 'нема'}   |`


        //Mnemocode
        +
        ` ${mnemoIndex !== -1
            ? '  ' + mnemoIndex + ' ' : '   нема'}${mnemoIndex !== -1 ? ' |   1'
            : '   '}  |`

        //Operand 1
        +
        `${operands.operand1
            ? '  ' + operands.operand1.position
            + '  |  '
            + operands.operand1.length

            + `${operands.operand1.length > 9
                ? '   |'
                : '    |'}`
            : '    нема     |'}`


        //Operand 2
        +
        `${operands.operand2
            ? '  ' + operands.operand2.position

            + `${operands.operand2.position > 9
                ? ' |  '
                : '  |  '}`

            + operands.operand2.length

            + `${operands.operand2.length > 9
                ? '|'
                : '    |'}`
            : '    нема     |'}`
    )

    console.log('-----------------------------------------------------\n')
}

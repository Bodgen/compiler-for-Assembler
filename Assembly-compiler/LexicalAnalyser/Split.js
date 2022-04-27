const withNoComments = arr => {
    const commentIndex = arr.indexOf(';')
    return commentIndex === -1 ? arr : arr.slice(0, commentIndex)
}

export default function splitString(string) {
    let str = string.toString().trim().toUpperCase().replaceAll('\t',' ').split('')
    let result = [], buf = []
    const separators = [':', '[', ']', ',', ' ','+','-','/','*']
    str = withNoComments(str)
    if(!str.length) return string
    for (const el of str) {
        if (separators.includes(el)) {
            result.push(buf.join(''), el)
            buf.length = 0
        } else {
            buf.push(el)
        }
    }
    result.push(buf.join(''))
    return result.filter(item => item[0] !== ' ' && item[0])
}


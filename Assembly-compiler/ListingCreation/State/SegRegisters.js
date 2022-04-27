class SegmentRegister {
    constructor(options) {
        this.name = options.name
        this.prefix = options.prefix
        this._destiny = null
    }

    setDestiny(destiny) {
        if (typeof destiny === 'string')
            this._destiny = destiny
        else throw new Error('Invalid parameter type was getting in method setDestiny, expected string instead of ' + typeof destiny)
    }
    getDestiny() {
        return this._destiny
    }
}

export const ES = new SegmentRegister({
    name: 'ES',
    prefix: 0x26
})
export const CS = new SegmentRegister({
    name: 'CS',
    prefix: 0x2E
})
export const SS = new SegmentRegister({
    name: 'SS',
    prefix: 0x36
})
export const DS = new SegmentRegister({
    name: 'DS',
    prefix: 0x3E
})
export const FS = new SegmentRegister({
    name: 'FS',
    prefix: 0x64
})
export const GS = new SegmentRegister({
    name: 'GS',
    prefix: 0x65
})



const common = {
    currentDisplacement: 0x0,
    currentSegment: '',
    currentMacro: '',
    currentMacroOperand: '',
    variables: {},
    identifiers: {},
    macroDefinitions: {},
    macroCounter: 0,
    errors: [],
    nullifyDisplacement() {
        this.currentDisplacement = 0x0
    },
    nullifySegment() {
        this.currentSegment = ''
    },
    setCurrentSegment(name) {
        this.currentSegment = name
    },
    addSizeToDisplacement(size) {
        this.currentDisplacement += size
    },
    hasIdentifier(token) {
        return !!this.identifiers[token];
    },
    hasVariable(token) {
        return !!this.variables[token];
    },
    setNewUserIdentifier(name) {
        if (!this.hasIdentifier(name)) {
            this.identifiers[name] = {
                name,
                displacement: this.currentDisplacement,
                segment: this.currentSegment
            }
            return true
        }
    },
    setNewVariable(name, size, value, mnemo) {
        this.variables[name] = {
            name,
            capacity: size,
            value,
            mnemo,
            isVar: true,
            displacement: this.currentDisplacement,
            segment: this.currentSegment
        }
        return 0
    },
    setMacroDefinition(name) {
        this.identifiers[name] = {
            name,
            isMacro: true
        }
    },
    setCurrentMacro(name) {
        this.currentMacro = name
    },
    hasMacro(name) {
        return !!this.identifiers[name]?.isMacro
    },
    hasMacroOperandDeclaration(operand){
        let f = false
        for (const el in this.macroDefinitions) {
            if(this.macroDefinitions.hasOwnProperty(el) && this.macroDefinitions[el]?.operand === operand) {
                f = true
                break
            }
        }
        return f
    },
    setMacroInfo(name, operand, data = []) {
        this.macroDefinitions[name] = {
            name,
            operand,
            hasOperand: !!operand,
            data
        }
    },
    getMacroInfo(name) {
        return {
            data: this.macroDefinitions[name]?.data,
            operand: this.macroDefinitions[name]?.operand,
            hasOperand: this.macroDefinitions[name]?.hasOperand
        }
    },
    addMacroInfo(line) {
        this.macroDefinitions[this.currentMacro].data.push(line)
    },
    setIsSegmentName(name) {
        this.identifiers[name].isSegmentName = true
        delete this.identifiers[name].segment
    },
    setIsLabel(name) {
        this.identifiers[name].isLabel = true
    },
    setIsVar(name, size) {
        this.identifiers[name].isVar = true
        let type
        switch (size) {
            case 1:
                type = 'BYTE'
                break
            case 2:
                type = 'WORD'
                break
            case 4:
                type = 'DWORD'
                break
        }
        this.identifiers[name].type = type
    },
    getVarInfo(name) {
        return {...this.variables[name]}
    },
    setSegmentSize(name) {
        this.identifiers[name].size = this.currentDisplacement
    },
    setPassedLabel(name) {
        this.identifiers[name].wasPassed = true
    },
    updateSegment(name) {
        this.identifiers[name].segment = this.currentSegment
    },
    updateDisplacement(name) {
        this.identifiers[name].displacement = this.currentDisplacement
    },
    updateIdentifierInfo(name) {
        this.setPassedLabel(name)
        this.updateSegment(name)
        this.updateDisplacement(name)
    },
    setNewError(lineIndex, errorText, cause) {
        this.errors.push({
            lineIndex,
            errorText,
            cause: cause ?? ''
        })
    }
}
export default common


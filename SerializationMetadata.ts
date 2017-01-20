
export class SerializationMetadata {
    private ctorToId: Map<any, string>;
    private idToCtor: Map<string, any>;
    private base: SerializationMetadata;

    public static default: SerializationMetadata;

    constructor(base?: SerializationMetadata) {
        this.base = base || SerializationMetadata.default;
        this.idToCtor = new Map<string, any>();
        this.ctorToId = new Map<any, string>();
    }

    public registerTypeId(id: string, ctor: any) {
        if(this.idToCtor.has(id)) {
            throw new Error("id: " + id + " is already registered");
        }

        this.idToCtor.set(id, ctor);
        this.ctorToId.set(ctor, id);
    }

    public getCtorByTypeId(typeId: string){
        let ctor = this.idToCtor.get(typeId);
        if(!ctor){
            if(!this.base) {
                throw new Error(`TypeId "${typeId}" was not found`);
            }

            ctor = this.base.getCtorByTypeId(typeId);
        }

        return ctor;
    }

    public getTypeIdByCtor(ctor): string {
        let typeId = this.ctorToId.get(ctor);
        if(typeId == undefined) {
            if(!this.base) {
                console.error("Unregistered type encountered", ctor);
                throw new Error("Unregistered type encountered");
            }

            typeId = this.base.getTypeIdByCtor(ctor);
        }

        return typeId;
    }
}

(function(){
    const metadata = SerializationMetadata.default = new SerializationMetadata();
    metadata.registerTypeId("Object", Object);
})();

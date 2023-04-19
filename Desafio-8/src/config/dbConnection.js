import { connect } from "mongoose"

const URL = 'mongodb+srv://MaitaJv:qpwo_1029@cluster0.asmvudf.mongodb.net/ecommerce?retryWrites=true&w=majority'

const dbConnection = async () => {
    return await connect(URL, err => {
        if (err) {
            console.log('No se puede conectar mongodb: ', err)
            process.exit()
        }
        console.log('DB conectada ')
    })
}

export default dbConnection
const {Schema, model} = require('mongoose')

const Product = new Schema({
    title: String,
    price: Number,
    text: String,
    img: String,
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    status: {
        type: Number,
        default: 0
        /* 
            0 - qo`shilyapti
            1 - aktiv mahsulot
            2 - nofaol mahsulot
        */
    }
})

module.exports = model('Product', Product);
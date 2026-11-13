const mongoose = require("mongoose");

const tecnologiaSchema = new mongoose.Schema(
    {
        nome: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        base: {
            type: String,
            required: true,
            enum: ["PHP", "C#", "JS"]
        },
        curvaAprendizado: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model(
    "Tecnologia",
    tecnologiaSchema,
    "tecnologias"
);

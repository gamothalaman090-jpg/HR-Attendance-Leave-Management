
const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    payrollId: {
        type: String,
        required: true,
        unique: true,
        default: () => `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Payroll entry must be linked to an employee'],
    },
    basicSalary: {
        type: Number,
        required: [true, 'Basic monthly salary is required'],
        min: [0, 'Salary cannot be a negative value'],
    },
    periodStart: { type: Date, required: [true, 'Pay period start date is required'] },
    periodEnd: { type: Date, required: [true, 'Pay period end date is required'] },
    status: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending',
    },
    paymentDate: { type: Date, default: null },
}, {
    timestamps: true,
});

payrollSchema.index({ employee: 1, status: 1 });

payrollSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payroll', payrollSchema);
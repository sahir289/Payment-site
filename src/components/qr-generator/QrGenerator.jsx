import React from 'react'
import QRCode from 'react-qr-code';

const QrGenerator = ({upi_id, amount, code,ac_name}) => {
    const payload = `upi://pay?pa=${upi_id}&pn=${ac_name}&am=${amount}&cu=INR&tn=${code}`
    return (
        <div>
           <QRCode value={payload} size={200}/>

        </div>
    )
}

export default QrGenerator;
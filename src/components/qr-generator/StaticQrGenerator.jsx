import React from 'react'
import QRCode from 'react-qr-code';

const StaticQrGenerator = ({upi_id}) => {
    const payload = `${upi_id}`
    return (
        <div>
           <QRCode value={payload} size={180}/>

        </div>
    )
}

export default StaticQrGenerator;
import React, { useEffect, useState } from 'react'
import { MdOutlineTimer } from "react-icons/md";
import { Divider } from 'antd';
import { RiFileCopyFill } from "react-icons/ri";
import { QrGenerator } from '../qr-generator'
import { copyToClipboard } from '../../utils';
import "./Upi.css";

const Upi = ({ code, amount, upi_id,formattedTime,ac_name }) => {
  return (
    <section className='upi-section'>
      <div className="bank-container">
        <p className='text'>Payment Time Left</p>
        <div className="right-area">
          <MdOutlineTimer size={20} color='white' />
          <p className='timer-text'>00:{formattedTime}</p>
        </div>
      </div>
      <div className="section-container">
        <div className="section-to">
          <span>Scan & Pay the exact amount only<br /> (upto lakh ) submit UTR</span>
        </div>
        <Divider />
        <div className="amount-container">
          <p className='amount-text'>Transfer Amount</p>
          <p className='price'>{amount}Rs. /-</p>
        </div>
        <div className='qr-container'>
          <QrGenerator upi_id={upi_id} amount={amount} code={code} ac_name={ac_name} />
        </div>
        <div className="details-section">
          <p>UPI ID</p>
          <div className="Upi-details">
            <span className='text-value'>{upi_id}</span>
            <div className="icon-copy" >
              <RiFileCopyFill size={20} color='white' onClick={() => copyToClipboard(code)} />
            </div>

          </div>
        </div>
        <Divider />
        <div className="details-section">
          <p>Code</p>
          <div className="Upi-details">
            <span className='text-value'>{code}</span>
            <div className="icon-copy" >
              <RiFileCopyFill size={20} color='white' onClick={() => copyToClipboard(code)} />
            </div>
          </div>
        </div>
        <Divider />
      </div>
    </section>
  )
}

export default Upi;

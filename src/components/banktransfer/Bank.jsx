import React from 'react'
import { MdOutlineTimer } from "react-icons/md";
import { Divider } from 'antd';
import { RiFileCopyFill } from "react-icons/ri";
import { copyToClipboard } from '../../utils';
import "./Bank.css"

const Bank = ({ ac_name, ac_no, bank_name, ifsc, amount, formattedTime }) => {


  return (
    <section>
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
          <p className='price'>Rs{amount}/-</p>
        </div>
        <Divider />
        <div className="details">
          <p>Bank</p>
          <span className='bank-value'>{bank_name}</span>
        </div>
        <Divider />
        <div className="details-section">
          <p>Account No</p>
          <div className="account-details">
            <span className="text-value" >{ac_no}</span>
            <div className="icon-copy">
              <RiFileCopyFill size={20} color='white' onClick={() => copyToClipboard(ac_no)} />
            </div>

          </div>
        </div>
        <Divider />
        <div className="details">
          <p>Name</p>
          <span className='bank-value'>{ac_name}</span>
        </div>
        <Divider />
        <div className="details-section">
          <p>IFSC Code</p>
          <div className="account-details">
            <span className='text-value'>{ifsc}</span>
            <div className="icon-copy" >
              <RiFileCopyFill size={20} color='white' onClick={() => copyToClipboard(ifsc)} />
            </div>

          </div>
        </div>
        <Divider />
      </div>
    </section>
  )
}

export default Bank;

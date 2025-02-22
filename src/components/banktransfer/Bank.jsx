import React from 'react'
import { MdOutlineTimer } from "react-icons/md";
import { Divider } from 'antd';
import { MdCopyAll } from "react-icons/md";
import { copyToClipboard } from '../../utils';
import "./Bank.css"

const Bank = ({ ac_name, ac_no, bank_name, ifsc, amount, name, }) => {


  return (
    <section>
      <div className="bank-container">
        <p className="text">Payment Time Left</p>
        <div className="right-area">
          <MdOutlineTimer size={20} color='black' />
          <p className='timer-text' id='bank-timer'>00:10:00</p>
        </div>
      </div>
      <div className="section-container">
        <div className="section-to text-sm">
          <span><b>Please pay the exact amount, then share the UTR for confirmation</b></span>
        </div>
        <Divider />
        <div className="amount-container">
          <p className='amount-text text-2xl'>Amount :</p>&nbsp;&nbsp;&nbsp;&nbsp;
          <p className='price text-2xl'>₹{amount}</p>
        </div>
        <Divider />
        <div className="details">
          <p>Bank</p>
          <div className="account-details">
            <span className="bank-value">{bank_name}</span>
            <div className="icon-copy">
              <MdCopyAll
                size={20}
                color="black"
                onClick={() => copyToClipboard(bank_name)}
              />
            </div>
          </div>
        </div>
        <Divider />
        <div className="details-section">
          <p>Account No</p>
          <div className="account-details">
            <span className="text-value-bank">{ac_no}</span>
            <div className="icon-copy">
              <MdCopyAll
                size={20}
                color="black"
                onClick={() => copyToClipboard(ac_no)}
              />
            </div>
          </div>
        </div>
        <Divider />
        <div className="details">
          <p>Name</p>
          <div className="account-details">
            <span className="bank-value">{name}</span>
            <div className="icon-copy">
              <MdCopyAll
                size={20}
                color="black"
                onClick={() => copyToClipboard(name)}
              />
            </div>
          </div>
        </div>
        <Divider />
        <div className="details-section">
          <p>IFSC Code</p>
          <div className="account-details">
            <span className="text-value-bank">{ifsc}</span>
            <div className="icon-copy">
              <MdCopyAll
                size={20}
                color="black"
                onClick={() => copyToClipboard(ifsc)}
              />
            </div>
          </div>
        </div>
        <div className="section-to text-xs mt-2">
          <span className='text-red-500'><b>ATTENTION: </b>These details are valid for the next 10 minutes. If payment is made after this period, you will be responsible for any potential losses.</span>
        </div>
        <Divider />
      </div>
    </section>
  );
}

export default Bank;

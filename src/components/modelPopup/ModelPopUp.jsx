import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { CgDanger } from "react-icons/cg";
import { AiFillQuestionCircle, CheckIcon, ClockIcon } from '../../utils/constants';


const ModelPopUp = (props) => {
    const { paymentModel, modelData, redirected, setRedirected } = props;
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Also add the notify url and data to give data to user.


    useEffect(() => {
        const timer = setTimeout(() => {
            // Open the URL in a new tab
            window.location.href = modelData?.return_url;
            setRedirected(true);
        }, 5000);

        // Cleanup the timeout if the component unmounts
        return () => clearTimeout(timer);
    }, [modelData]);

    console.log(modelData);

    return (
        <Modal open={paymentModel} width={900} closable={false} className='font-sans' footer={false} style={{borderRadius:"10px"}} >
            <div className='flex justify-center'>
                <div className='w-22 h-22 rounded-[100%] flex' style={{backgroundColor: "cornflowerblue"}} >
                    {modelData?.status === "SUCCESS" && <div className='flex ps-5 mt-4'> <CheckIcon /></div>}
                    {modelData?.status === "PENDING" && <span className='flex items-center ps-2'><ClockIcon /></span>}
                    {modelData?.status === "Not Found" && <span className='flex items-center ps-2'><ClockIcon /></span>}
                    {modelData?.status === "BANK_MISMATCH" && <span className='flex items-center ps-2'><AiFillQuestionCircle color='white'  /></span>}

                </div>

            </div>
            <div className='flex justify-center mt-5 text-3xl  font-bold'>
                <p>
                    {modelData?.status === "SUCCESS" && "Payment completed"}
                    {modelData?.status === "PENDING" && "UTR Submitted!!!"}
                    {modelData?.status === "Not Found" && "UTR Submitted!!!"}
                    {modelData?.status === "DUPLICATE" && "Duplicate UTR found!!!"}
                    {modelData?.status === "DISPUTE" && "There is an Dispute in payment"}
                    {modelData?.status === "BANK_MISMATCH" && "Bank Mismatch!!!"}
                </p>
            </div>
            {modelData?.status === "PENDING" && <div className='text-center'>Your points will be credited soon</div>}
            {modelData?.status === "Not Found" && <div className='text-center'>Your points will be credited soon</div>}
            {modelData?.status === "DUPLICATE" && <div className='text-center text-red-600 '>Please contact to customer services for further info.</div>}
            {modelData?.status === "DISPUTE" && <div className='text-center text-red-600 '>Please contact to customer services for further info.</div>}
            {modelData?.status === "BANK_MISMATCH" && <div className='text-center text-red-600 '>Please contact to customer services for further info.</div>}

            <div className='mt-5'>
                <div className='flex justify-between'>
                    <p className='text-lg font-bold'>Amount</p>
                    <p className='text-lg font-bold' style={{color: "cornflowerblue"}} >{modelData?.status === "SUCCESS" ? `₹${modelData?.amount}` : modelData?.status === "PENDING" ? `₹${modelData?.amount}` : modelData?.status === "BANK_MISMATCH" ? `₹${modelData?.amount}` : modelData?.status === "Not Found" ? `₹${modelData?.amount}` : modelData?.status === "DUPLICATE" ? `₹${modelData?.amount}` : "--"}</p>
                </div>
                <div className='flex justify-between mt-3'>
                    <p className='text-lg font-bold'>UTR No.</p>
                    <p className='text-lg font-bold' style={{color: "cornflowerblue"}} >{modelData?.utr_id ? modelData?.utr_id : "--"}</p>
                </div>
                <div className='flex justify-between mt-3'>
                    <p className='text-lg font-bold'>Transaction ID.</p>
                    <p className='text-xs font-bold' style={{paddingLeft: "68px", color: "cornflowerblue"}} >{modelData?.status === "Not Found" ? modelData?.transactionId : modelData?.status === "DUPLICATE" ? modelData?.transactionId : modelData?.merchant_order_id}</p>
                </div>
            </div>

            {/* <div className='mt-3 text-center text-sm'>
                <p><b>Note :</b> If your transaction is not confirmed in 5 mins then please contact the customer support</p>
            </div> */}

            {/* <div className='mt-6 text-center text-xl bg-black text-white p-3 rounded-lg'>
                <p>Don't close this window</p>
            </div> */}

        </Modal>
    )
}

export default ModelPopUp
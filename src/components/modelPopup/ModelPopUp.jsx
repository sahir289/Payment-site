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

    return (
        <Modal open={paymentModel} width={900} className='font-serif' footer={false}>
            <div className='flex justify-center mt-10'>
                <div className='bg-green-800 w-32 h-32 rounded-[100%] flex' >
                    {modelData?.status === "SUCCESS" && <div className='flex ps-5 mt-4'> <CheckIcon /></div>}
                    {modelData?.status === "PENDING" && <span className='flex items-center ps-2'><ClockIcon /></span>}
                    {modelData?.status === "BANK_MISMATCH" && <span className='flex items-center ps-2'><AiFillQuestionCircle color='white'  /></span>}

                </div>

            </div>
            <div className='flex justify-center mt-5 text-3xl  font-bold'>
                <p>
                    {modelData?.status === "SUCCESS" && "Payment completed"}
                    {modelData?.status === "PENDING" && "UTR Submitted!!!"}
                    {modelData?.status === "DUPLICATE" && "Duplicate UTR found!!!"}
                    {modelData?.status === "DISPUTE" && "There is an Dispute in payment"}
                    {modelData?.status === "BANK_MISMATCH" && "Bank Mismatch!!!"}
                </p>
            </div>
            {modelData?.status === "PENDING" && <div className='text-center '>Your points will be credited in few minutes</div>}
            {modelData?.status === "DUPLICATE" && <div className='text-center text-red-600 '>Please contact to customer services for further info.</div>}
            {modelData?.status === "DISPUTE" && <div className='text-center text-red-600 '>Please contact to customer services for further info.</div>}
            {modelData?.status === "BANK_MISMATCH" && <div className='text-center text-red-600 '>Please contact to customer services for further info.</div>}

            <div className='mt-16'>
                <div className='flex justify-between'>
                    <p className='text-xl '>Amount</p>
                    <p className='text-xl  font-bold '>{modelData?.status === "SUCCESS" ? modelData?.amount : modelData?.status === "PENDING" ? modelData?.amount : modelData?.status === "BANK_MISMATCH" ? modelData?.amount : "--"}</p>
                </div>
                <div className='flex justify-between mt-6'>
                    <p className='text-xl  '>UTR No.</p>
                    <p className='text-xl  font-bold '>{modelData?.utr_id ? modelData?.utr_id : "--"}</p>
                </div>
                <div className='flex justify-between  mt-6'>
                    <p className='text-xl  '>Transaction Id.</p>
                    <p className='text-xl  font-bold '>{modelData?.merchant_order_id}</p>
                </div>
            </div>

            <div className='mt-6 text-center text-lg'>
                <p>If the transaction is not confirmed in 5 mins then please contact the customer support</p>
            </div>

            <div className='mt-6 text-center text-xl bg-black text-white p-3 rounded-lg'>
                <p>Don't close this window</p>
            </div>

        </Modal>
    )
}

export default ModelPopUp
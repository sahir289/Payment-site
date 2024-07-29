import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { CheckIcon, ClockIcon } from '../../utils/constants';


const ModelPopUp = (props) => {
    const { paymentModel, modelData } = props;
    console.log("🚀 ~ ModelPopUp ~ modelData:", modelData)
    console.log("🚀 ~ ModelPopUp ~ paymentModel:", paymentModel)
    const [isModalOpen, setIsModalOpen] = useState(false);
    console.log("🚀 ~ setTimeout ~ modelData?.return_url:", modelData?.return_url)


    // Also add the notify url and data to give data to user.


    useEffect(() => {
        const timer = setTimeout(() => {
            // Open the URL in a new tab
            window.open(modelData?.return_url || "https://www.google.com/");
        }, 5000);

        // Cleanup the timeout if the component unmounts
        return () => clearTimeout(timer);
    }, [modelData]);

    return (
        <Modal open={paymentModel} width={900} className='font-serif' footer={false}>
            <div className='flex justify-center mt-10'>
                <div className='bg-green-800 w-32 h-32 rounded-[100%] flex' >
                    {modelData?.status === "Success" && <div className='flex ps-5 mt-4'> <CheckIcon /></div>}
                    {modelData?.status === "Not Found" && <span className='flex items-center ps-2'><ClockIcon /></span>}
                </div>

            </div>
            <div className='flex justify-center mt-5 text-3xl  font-bold'>
                <p>{modelData?.status === "Success" && "Payment completed"}{modelData?.status === "Not Found" && "UTR Submitted!!!"}{modelData?.status === "DUPLICATE" && "Duplicate UTR found!!!"}</p>
            </div>
            {modelData?.status === "Not Found" && <div className='text-center '>Your points will be credited in few minutes</div>}
            {modelData?.status === "DUPLICATE" && <div className='text-center text-red-600 '>Please contact to customer services for further info.</div>}


            <div className='mt-16'>
                <div className='flex justify-between'>
                    <p className='text-xl   '>Amount</p>
                    <p className='text-xl  font-bold '>{modelData?.status === "Success" ? modelData?.amount : modelData?.status === "Not Found" ? modelData?.amount : "--"}</p>
                </div>
                <div className='flex justify-between mt-6'>
                    <p className='text-xl  '>UTR No.</p>
                    <p className='text-xl  font-bold '>{modelData?.status === "Success" ? modelData?.utr : "--"}</p>
                </div>
                <div className='flex justify-between  mt-6'>
                    <p className='text-xl  '>Transaction Id.</p>
                    <p className='text-xl  font-bold '>{modelData?.transactionId}</p>
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
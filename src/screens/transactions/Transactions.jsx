import React, { useEffect, useState } from 'react'
import { Spin, Tabs, Modal, Form, Input, Button, message } from 'antd';
import { FcRating } from "react-icons/fc";
import { Upi, Bank, Result } from '../../components';
import { useNavigate, useParams } from 'react-router-dom'
import { userAPI } from '../../services';
import "./transactions.css"
import ModelPopUp from '../../components/modelPopup/ModelPopUp';
import WebSockets from '../../components/webSockets/WebSockets';

const Transactions = () => {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [amount, setAmount] = useState('0.0');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [transactionsInformation, setTransactionInformation] = useState(null);
    const [status, setStatus] = useState(null);
    const [timer, setTimer] = useState(10 * 60);
    const [expireTime, setExpireTime] = useState(10000000000)
    const [urlExpired, setUrlExpired] = useState(false)
    const [paymentModel, setPaymentModel] = useState(false)
    const [modelData, setModelData] = useState({})
    console.log("🚀 ~ Transactions ~ modelData:", modelData)
    const [webSocketData, setWebSocketData] = useState(false);

    const expireUrlHandler = async () => {
        const token = params.token
        const res = await userAPI.validateToken(token);
        setUrlExpired(true)
    }

    const checkPaymentStatusHandler = async () => {
        const token = params.token
        const res = await userAPI.checkPaymentStatus(token);
        if (res?.data?.data?.status === "Success") {
            setPaymentModel(true)
            setModelData(res?.data?.data)
        }
    }

    // useEffect(()=>{
    //     if (webSocketData===true){
    //         console.log("8888888888888")
    //         checkPaymentStatus()
    //     }
    // },[webSocketData])

    useEffect(() => {
        if (urlExpired === false && paymentModel === false) {
            
            setTimeout(() => {
                checkPaymentStatusHandler();
            }, 3000)
           
        }
    }, [urlExpired, paymentModel, timer]);



    useEffect(() => {

        if (timer <= 0) {
            setStatus({
                status: "403",
                message: "The Link has been expired!",
            })
            return;
        }
        const timerID = setTimeout(() => tick(), 1000);

        return () => clearTimeout(timerID);
    }, [timer]);



    useEffect(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > expireTime) {
            expireUrlHandler();
        }
    }, [timer]);

    useEffect(() => {
        handleValidateToken();
    }, [params.token])

    const handleValidateToken = async () => {
        const token = params.token
        setLoading(true);
        const res = await userAPI.validateToken(token);
        setLoading(false);
        if (res.error) {
            setStatus({
                status: res.error?.error?.status || "error",
                message: res.error.message,
            })
            return;
        }
        const data = res.data.data;
        if (data?.expiryTime) {
            const difference = new Date(data.expiryTime * 1000).getTime() - new Date().getTime();
            const seconds = Math.floor(difference / 1000)
            if (seconds > 0) {
                setTimer(seconds);
            }
        }
        setExpireTime(data?.expiryTime)
        setIsModalOpen(true);

    }

    const handleUtrNumber = async (data) => {
        const updateData = {
            usrSubmittedUtr: data?.utrNumber,
            code: transactionsInformation?.code,
            amount,
        }
        setProcessing(true);
        const res = await userAPI.processTransaction(params.token, {
            ...updateData,
        })
        setProcessing(false);
        if (res?.data?.data) {
            setPaymentModel(true)
            setModelData(res?.data?.data)
        }

    }

    const handleAmount = (data) => {
        const token = params.token
        setIsModalOpen(false);
        setAmount(data.amount)
        const amount = data
        const bankAssignRes = userAPI.assignBankToPayInUrl(token, amount).then((res) => {
            setTransactionInformation(res?.data?.data || null);
        }).catch((err) => {
            console.log(err)
        })
    }

    function tick() {
        setTimer(prevTimer => (prevTimer > 0 ? prevTimer - 1 : 0));
    }

    const formatTime = (time) => {
        const minutes = String(Math.floor(time / 60)).padStart(2, '0');
        const seconds = String(time % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const formattedTime = formatTime(timer);
    if (loading) {
        return (
            <div className='loader-component'>
                <Spin />
            </div>
        )
    }

    if (status) {
        return <Result {...status} />
    }


    return (
        <>
          <WebSockets checkPaymentStatusHandler={()=>{checkPaymentStatusHandler()}} setWebSocketData={setWebSocketData} />
            
            <div className='main-section'>
                {paymentModel === true && <ModelPopUp paymentModel={paymentModel} modelData={modelData} />}
                <header>
                    <div className="icon">
                        <FcRating size={30} />
                        <p>Trust Pay</p>
                    </div>
                </header>
                <div className='main-content'>
                    <Tabs
                        defaultActiveKey="1"
                        className='tabs'
                        type="card"
                        tabBarGutter={10}
                    >
                        <Tabs.TabPane tab='Upi' key='1'>
                            <Upi {...transactionsInformation} amount={amount} formattedTime={formattedTime} />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab='Bank Transfer' key='3'>
                            <Bank {...transactionsInformation} amount={amount} formattedTime={formattedTime} />
                        </Tabs.TabPane>
                    </Tabs>
                    <Form layout='vertical' onFinish={handleUtrNumber}>
                        <div className="utr-number">
                            <Form.Item
                                label={
                                    <span>
                                        Enter UTR Number
                                        <span className='text-red-500' style={{ marginLeft: 8 }}>
                                            (* UTR can be submitted only once)
                                        </span>
                                    </span>
                                }
                                name="utrNumber"
                                rules={[
                                    { required: true, message: 'Please enter UTR no' },
                                    { pattern: /^\d{12}$/, message: 'UTR number must be exactly 12 digits' }
                                ]}
                            >
                                <Input
                                    type='text'
                                    size='large'
                                />
                            </Form.Item>

                            <Form.Item name="" label=" ">
                                <Button
                                    type='primary'
                                    size='large'
                                    htmlType='submit'
                                    loading={processing}
                                >
                                    Submit
                                </Button>
                            </Form.Item>
                        </div>
                    </Form>
                </div>
                <Modal title="Attention" open={isModalOpen} footer={false}>
                    <Form layout='vertical' onFinish={handleAmount}>
                        <div>
                            <Form.Item
                                name='amount'
                                label="Please enter the amount for this transaction"
                                rules={[{ required: true, message: 'Please enter amount' }]}
                            >
                                <Input
                                    type='number'
                                    placeholder='Enter New Amount'
                                    size='large'
                                    addonAfter="₹"
                                />
                            </Form.Item>
                            <Button type='primary' htmlType='submit'>Submit</Button>
                        </div>
                    </Form>
                </Modal>
            </div >
        </>

    )
}

export default Transactions

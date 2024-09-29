import React, { useEffect, useState } from "react";
import { Spin, Tabs, Modal, Form, Input, Button } from "antd";
import { FcRating } from "react-icons/fc";
import { Upi, Bank } from "../../components";
import { useParams } from "react-router-dom";
import { userAPI } from "../../services";
import ModelPopUp from "../../components/modelPopup/ModelPopUp";
import WebSockets from "../../components/webSockets/WebSockets";
import { ErrorImg } from "../../utils/constants";
import { useLocation } from 'react-router-dom';
import "./transactions.css";


const Transactions = () => {
  const params = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [amountLoading, setAmountLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState("0.0");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionsInformation, setTransactionInformation] = useState(null);
  const [status, setStatus] = useState(null);
  const [paymentModel, setPaymentModel] = useState(false);
  const [modelData, setModelData] = useState({});
  const [redirected, setRedirected] = useState(false);
  const isQr = !transactionsInformation || transactionsInformation.is_qr;
  const isBank = !transactionsInformation || transactionsInformation.is_bank;
  const [showTrustPayModal, setShowTrustPayModal] = useState(false);
  const queryParams = new URLSearchParams(location.search);
  const isTestMode = queryParams.get('t');
  const _10_MINUTES = 1000 * 60 * 10;
  let timer = 60 * 10;
  let expireTime = Date.now() + _10_MINUTES;

  useEffect(()=>{
    // listener for tab or window focus
    document.addEventListener('visibilitychange', setTimerSeconds);
    document.addEventListener("focus", setTimerSeconds);
    
    return ()=>{
      document.removeEventListener('visibilitychange', setTimerSeconds);
      document.removeEventListener("focus", setTimerSeconds);
    }
  }, []);

  useEffect(() => {
    handleValidateToken();
    handleTimer();
  }, [params.token])

  const handleTimer = ()=>{
    const currentTime = Date.now();
    if (timer <= 0 || currentTime > expireTime) {
      expireUrlHandler();
      return;
    }
    timer = timer - 1;
    const formattedTime = formatTime(timer);
    ["bank-timer", "upi-timer"].forEach(el=>{
      const div = document.getElementById(el);
      if(div){
        div.innerHTML = formattedTime;
      }
    })
    setTimeout(handleTimer, 1000);
  }
  const expireUrlHandler = async () => {
    const token = params.token;
    // don't know why we are calling this API
    await userAPI.validateToken(token);
    await userAPI.expireUrl(token);
    setStatus({
      status: "403",
      message: "The Link has been expired!",
    });
  };

  const checkPaymentStatusHandler = async () => {
    const token = params.token;
    const res = await userAPI.checkPaymentStatus(token);
    // res.data.data.amount = 5000000;
    if (res?.data?.data?.status === "Success") {
      setPaymentModel(true);
      setModelData(res?.data?.data);
    } else if (res?.data?.data?.status === "DISPUTE") {
      setPaymentModel(true);
      setModelData(res?.data?.data);
    } else if (res?.error?.error?.status === 400) {
      setInterval(() => {
        setStatus({
          status: "400",
          message: "Url is Already expired!",
        });
      }, 10000);
    }
    // if (res?.data?.data?.amount !== 0) {
    //   setIsModalOpen(false);
    //   const data = {
    //     amount: res?.data?.data?.amount,
    //   }
    //   // handleAmount(data);
    // }
    // else {
    //   setIsModalOpen(true);
    // }
    setIsModalOpen(true);
  };

  const handleValidateToken = async () => {
    const token = params.token;
    setLoading(true);
    const res = await userAPI.validateToken(token);
    setLoading(false);
    if (res.error) {
      setStatus({
        status: res.error?.error?.status || "error",
        message: res.error.message,
      });
      return;
    }
    const data = res.data.data;
    if (data?.one_time_used) {
      setStatus({
        status: "403",
        message: "The Link has been expired!",
      });
      return;
    }
    if (data?.expiryTime) {
      expireTime = data.expiryTime * 1000;
      setTimerSeconds();
    }
    await userAPI.payInOneTimeExpireURL(token)
  };

  const handleUtrNumber = async (data) => {
    const updateData = {
      usrSubmittedUtr: data?.utrNumber,
      code: transactionsInformation?.code,
      amount,
    };
    setProcessing(true);
    const res = await userAPI.processTransaction(params.token, {
      ...updateData,
    });
    setProcessing(false);
    if (res?.data?.data) {
      setPaymentModel(true);
      setModelData(res?.data?.data);
    }
  };

  const handleAmount = async (data) => {
    const token = params.token;
    setAmount(data.amount);
    const amount = data;
    setAmountLoading(true);
    const res = await userAPI.assignBankToPayInUrl(token, amount);
    setAmountLoading(false);
    if (res.error?.error?.status === 404) {
      setStatus({
        status: "404",
        message: "Bank is not linked with the merchant!",
      });
      expireUrlHandler();
      return;
    } else {
      isTestMode && setShowTrustPayModal(true);
    }
    const bankData = res?.data?.data || null;
    setTransactionInformation(bankData);
    if(!bankData.is_bank && !bankData.is_qr){
      setStatus({
        status: "404",
        message: "No payment methods are available!",
      });
      return;
    }
    setIsModalOpen(false);
  };

  const formatTime = (time) => {
    const minutes = String(Math.floor(time / 60)).padStart(2, "0");
    const seconds = String(time % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleImgSubmit = async (data) => {
    const token = params.token;
    const fileData = data.img[0];
    if (!fileData) {
      return;
    }
    const formData = new FormData();
    formData.append("file", fileData);
    setProcessing(true);
    const res = await userAPI.imageSubmit(token, formData, amount);
    if(res.error){
      return;
    }
    setPaymentModel(true);
    setModelData(res?.data?.data);
    setProcessing(false);
  };

  const handleTestResult = (data) => {
    const apiData = {
      status : data,
    };
    const token = params.token;
    setProcessing(true);
    const testResultRes = userAPI.testResult(token, { ...apiData  });
    setProcessing(false);
    if (testResultRes) {
      setStatus({
        status: "200",
        message: "Test Applied",
      });
    }
  };

  const setTimerSeconds = ()=>{
    const difference = new Date(expireTime).getTime() - Date.now();
    const seconds = Math.floor(difference / 1000);
    timer = seconds > 0 ? seconds: 0;
  }

  return (
    <>
      <WebSockets checkPaymentStatusHandler={checkPaymentStatusHandler} />

      {loading ? (
        <Spin />
      ) : (
        <>
          {status !== null ? (
            <>
              <ErrorImg />
              <div className="font-serif text-2xl bg-blue-400 p-6 font-semibold rounded-lg mt-2">
                <p className="">Status : {status?.status}</p>
                <p>Message: {status?.message}</p>
              </div>
            </>
          ) : (
            <>
              <div className="main-section">
                {paymentModel === true && (
                  <ModelPopUp
                    paymentModel={paymentModel}
                    modelData={modelData}
                    redirected={redirected}
                    setRedirected={setRedirected}
                  />
                )}
                <header>
                  <div className="icon">
                    <FcRating size={30} />
                    <p>Trust Pay</p>
                  </div>
                </header>
                <div className="main-content">
                  <Tabs
                    defaultActiveKey="1"
                    className="tabs"
                    type="card"
                    tabBarGutter={5}
                    style={{ marginTop: "-10px" }}
                  >
                  {
                    isQr &&
                    <Tabs.TabPane tab="UPI" key="1">
                      <Upi
                        {...transactionsInformation}
                        amount={amount}
                      />
                    </Tabs.TabPane>
                  }
                  {
                    isBank &&
                    <Tabs.TabPane tab="Bank Transfer" key="3">
                      <Bank
                        {...transactionsInformation}
                        amount={amount}
                      />
                    </Tabs.TabPane>
                  }
                  </Tabs>


                  <Tabs defaultActiveKey="1" className="bottom-tabs" type="card">
                    <Tabs.TabPane tab="Enter UTR" key="1">
                      <Form
                        layout="vertical"
                        onFinish={handleUtrNumber}
                        className="utr-number pt-[30px] mt-[-24px]"
                      >
                          <Form.Item
                            label={
                              <span>
                                Enter UTR Number
                                <span
                                  className="text-red-500"
                                  style={{ marginLeft: 8 }}
                                >
                                  (* UTR can be submitted only once)
                                </span>
                              </span>
                            }
                            name="utrNumber"
                            rules={[
                              {
                                required: true,
                                message: "Please enter UTR no",
                              },
                              {
                                pattern: /^\d{12}$/,
                                message: "UTR number must be exactly 12 digits",
                              },
                            ]}
                          >
                            <Input type="text" size="middle" maxLength={12}
                            onKeyDown={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                const isControlKey = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'].includes(e.key);
                                if (!isControlKey) {
                                  e.preventDefault();
                                }
                              }
                            }}
                             />
                          </Form.Item>
                          <Form.Item name="" label=" ">
                            <Button
                              type="primary"
                              size="middle"
                              htmlType="submit"
                              loading={processing}
                              className="ml-1"
                            >
                              Submit
                            </Button>
                          </Form.Item>
                      </Form>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Upload ScreenShot" key="2">
                      <Form
                        layout="vertical"
                        onFinish={handleImgSubmit}
                        className="utr-number mt-[6px]"
                      >
                        <Form.Item
                          name="img"
                          label="Add the Image here"
                          valuePropName="files"
                          rules={[
                            {
                              required: true,
                              message: "Please upload image first",
                            }
                          ]}
                        >
                            <Input
                              accept="image/*"
                              type="file"
                              size="middle"
                              className="h-[32px] py-0 pt-[1px]"
                            />
                        </Form.Item>
                        <Form.Item name="" label=" ">
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={processing}
                              className="ml-1"
                              size="middle"
                            >
                              Submit
                            </Button>
                        </Form.Item>
                      </Form>
                    </Tabs.TabPane>
                  </Tabs>
                </div>
                <Modal title="Attention" open={isModalOpen} footer={false} closable={false}>
                  <Form layout="vertical" onFinish={handleAmount}>
                    <div>
                      <Form.Item
                        name="amount"
                        label="Please enter the amount for this transaction"
                        rules={[
                          { required: true, message: "Please enter amount" },
                        ]}
                      >
                        <Input
                          type="number"
                          placeholder="Enter New Amount"
                          size="large"
                          addonAfter="₹"
                          min={1}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') {
                              e.preventDefault();
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value <= 0) {
                              e.target.value = "";
                            }
                          }}
                        />
                      </Form.Item>
                      <Button type="primary" htmlType="submit" loading={amountLoading}>
                        Submit
                      </Button>
                    </div>
                  </Form>
                </Modal>
                {isTestMode && <Modal
                  title={
                    <div className="absolute inset-x-0 top-0 text-center text-2xl text-white bg-black py-6" style={{ width: '100%', zIndex: 1 }}>
                      Welcome to Trust Pay
                    </div>
                  }
                  open={showTrustPayModal}
                  footer={
                    <div className="flex flex-col items-center gap-4 py-4">
                      <p className="text-zinc-600 text-lg text-center mb-6">
                        This is a test Payment. You can choose it to be a success or failure.
                      </p>
                      <Button
                        key="Test Success"
                        type="primary"
                        onClick={() => handleTestResult('TEST_SUCCESS')}
                        className="bg-green-600 border-green-600 text-white w-80 h-12 text-lg"
                      >
                        Test Success
                      </Button>
                      <Button
                        key="Test Failure"
                        type="primary"
                        onClick={() => handleTestResult('TEST_DROPPED')}
                        className="bg-red-600 border-red-600 text-white w-80 h-12 text-lg"
                      >
                        Test Failure
                      </Button>
                    </div>
                  }
                  bodyStyle={{
                    color: 'white',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    boxShadow: 'none'
                  }}
                  style={{
                    borderRadius: '0.75rem',
                    width: '600px',
                    position: 'relative' 
                  }}
                  headerStyle={{
                    backgroundColor: 'black',
                    color: 'white',
                    borderBottom: 'none',
                    boxShadow: 'none'
                  }}
                >
                </Modal>}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Transactions;

import React, { useEffect, useState } from "react";
import { Spin, Tabs, Modal, Form, Input, Button , notification, Upload } from "antd";
import { UploadOutlined } from '@ant-design/icons';
import { FcRating } from "react-icons/fc";
import { Upi, Bank } from "../../components";
import { useParams } from "react-router-dom";
import { userAPI } from "../../services";
import ModelPopUp from "../../components/modelPopup/ModelPopUp";
import WebSockets from "../../components/webSockets/WebSockets";
import { ErrorImg } from "../../utils/constants";
import { useLocation } from "react-router-dom";
import "./transactions.css";
import pcicertificate from "../assets/pcicertificate.jpg";
import norton from "../assets/norton.jpg";

const Transactions = () => {
  const params = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [amountLoading, setAmountLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

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
  const isTestMode = queryParams.get("t");
  const videoUrl = "https://drive.google.com/file/d/1EAGL_TTjx2kn_hsB6S0gE1x4-d1YywjP/preview";

  const _10_MINUTES = 1000 * 60 * 10;
  let timer = 60 * 10;
  let expireTime = Date.now() + _10_MINUTES;

  useEffect(() => {
    // listener for tab or window focus
    document.addEventListener("visibilitychange", setTimerSeconds);
    document.addEventListener("focus", setTimerSeconds);

    return () => {
      document.removeEventListener("visibilitychange", setTimerSeconds);
      document.removeEventListener("focus", setTimerSeconds);
    };
  }, []);

  useEffect(() => {
    handleValidateToken();
    handleTimer();
  }, [params.token]);

  const handleTimer = () => {
    const currentTime = Date.now();
    if (timer <= 0 || currentTime > expireTime) {
      expireUrlHandler();
      return;
    }
    timer = timer - 1;
    const formattedTime = formatTime(timer);
    ["bank-timer", "upi-timer"].forEach((el) => {
      const div = document.getElementById(el);
      if (div) {
        div.innerHTML = formattedTime;
      }
    });
    setTimeout(handleTimer, 1000);
  };
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
  const handleVideoSelect = (url) => {
    videoUrl(url);
  };

  const checkPaymentStatusHandler = async () => {
    const token = params.token;
    const res = await userAPI.checkPaymentStatus(token);
    // res.data.data.amount = 5000000;
    if (res?.data?.data?.status === "SUCCESS") {
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
    userAPI.payInOneTimeExpireURL(token)
    if (data?.expiryTime) {
      expireTime = data.expiryTime * 1000;
      setTimerSeconds();
    }
    if(Number(data?.amount) > 0){
      handleAmount(data);
      return;
    }
    setIsModalOpen(true);
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
      setModelData({ ...res?.data?.data});
    }
  };

  const handleAmount = async (data) => {
    const token = params.token;
    const amount = parseFloat(data.amount);
    setAmount(amount);
    setAmountLoading(true);
  
    const res = await userAPI.assignBankToPayInUrl(token, { amount });
    setAmountLoading(false);     
    if (res.error?.error?.status === 404) {
      setStatus({
        status: "404",
        message: "Bank is not linked with the merchant!",
      });
      expireUrlHandler();
      return; 
    }else {
      isTestMode && setShowTrustPayModal(true);
    }
  
    const bankData = res?.data?.data || null;
    
    if (!bankData) {
      setStatus({
        status: "404",
        message: "No bank data available!",
      });
      return; 
    }
    
    if (!bankData.is_bank && !bankData.is_qr) {
      setStatus({
        status: "404",
        message: "No payment methods are available!", 
      });
      return; 
    }
  
    // Validate if the amount is within the ranges
    const minPayin = parseFloat(bankData.merchant_min_payin); 
    const maxPayin = parseFloat(bankData.merchant_max_payin);
    // Check if the amount is within the valid range
    if (amount < minPayin || amount > maxPayin) {
      notification.error({
        message: `Amount must be between ${minPayin} and ${maxPayin}!`,
      });
  
      if (amountInputRef.current) {
        amountInputRef.current.focus();
      }
      
      return; 
    }

    if (res.data.statusCode === 201) {
      setTransactionInformation(bankData);
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
    if (res.error) {
      return;
    }
    setPaymentModel(true);
    setModelData(res?.data?.data);
    setProcessing(false);
  };

  const handleTestResult = (data) => {
    const apiData = {
      status: data,
    };
    const token = params.token;
    setProcessing(true);
    const testResultRes = userAPI.testResult(token, { ...apiData });
    setProcessing(false);
    if (testResultRes) {
      setStatus({
        status: "200",
        message: "Test Applied",
      });
    }
  };

  const setTimerSeconds = () => {
    const difference = new Date(expireTime).getTime() - Date.now();
    const seconds = Math.floor(difference / 1000);
    timer = seconds > 0 ? seconds : 0;
  };

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
                {/* <header>
                  <div className="icon">
                    <FcRating size={30} />
                    <p>Trust Pay</p>
                  </div>
                </header> */}
                <div className="main-content">
                  <Tabs
                    defaultActiveKey="1"
                    className="tabs"
                    type="card"
                    tabBarGutter={5}
                    style={{ marginTop: "-10px" }}
                  >
                    {isQr && (
                      <Tabs.TabPane tab="UPI" key="1">
                        <Upi {...transactionsInformation} amount={amount} />
                      </Tabs.TabPane>
                    )}
                    {isBank && (
                      <Tabs.TabPane tab="Bank Transfer" key="3">
                        <Bank {...transactionsInformation} amount={amount} />
                      </Tabs.TabPane>
                    )}
                  </Tabs>
                  <Tabs
                    defaultActiveKey="1"
                    className="bottom-tabs mt-[-18px]"
                    type="card"
                  >
                    <Tabs.TabPane tab="Enter UTR" key="1">
                      <Form
                        layout="vertical"
                        onFinish={handleUtrNumber}
                        className="utr-number pt-[15px] mt-[-24px]"
                      >
                        <Form.Item
                          label={<span>Enter UTR Number</span>}
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
                          <Input type="text" size="middle" maxLength={12} />
                        </Form.Item>
                        <Form.Item name="" label=" ">
                          <Button
                            type="primary"
                            size="middle"
                            htmlType="submit"
                            loading={processing}
                            className="ml-1 text-black"
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
                            },
                          ]}
                        >
                          <Input
                            accept="image/*"
                            type="file"
                            size="middle"
                            className="h-[32px] py-0 pt-[1px]"
                          />
                          {/* <Upload>
                            <Button icon={<UploadOutlined />}>Click to Upload</Button>
                          </Upload> */}
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
                  <div className="bg-white rounded-lg shadow-md mx-auto w-full font-serif">
                    <div className="flex justify-center space-x-4">
                      <img
                        src={norton}
                        alt="Norton Certification"
                        className="w-24 h-24 object-contain rounded-md"
                      />
                      <img
                        src={pcicertificate}
                        alt="PCI Certificate"
                        className="w-24 h-24 object-contain rounded-md"
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md mx-auto w-full font-serif">
                    <div className="border-t border-gray-200 pt-4 text-center bg-black">
                      <h2 className="text-gray-50 font-semibold mb-2">
                        {!showVideo && (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowVideo(true); // Show the video when clicked
                            }}
                            className="text-gray-50 font-medium hover:underline"
                          >
                            Watch a video for Quick Deposit instructions:
                          </a>
                        )}
                      </h2>

                      {/* Video Section with Close Button */}
                      {showVideo && (
                        <div
                          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-lg overflow-hidden"
                          style={{
                            width: "40%",
                            maxWidth: "600px",
                            paddingBottom: "30.25%",
                          }}
                        >
                          <iframe
                            src={videoUrl}
                            title="Quick Deposit Instructions"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute top-0 left-0 w-full h-full"
                          ></iframe>
                          <button
                            onClick={() => setShowVideo(false)}
                            className="absolute top-2 right-2 text-black bg-gray-300 rounded-full p-1 hover:bg-gray-400"
                            aria-label="Close video"
                          >
                            &times; {/* Close icon (X) */}
                          </button>
                        </div>
                      )}

                      {/* Language Links */}
                      <div className="space-y-2 mt-4">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowVideo(true); // Show the video when a language link is clicked
                          }}
                          className="text-gray-50 font-medium hover:underline"
                        >
                          Telugu -
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowVideo(true); // Show the video when a language link is clicked
                          }}
                          className="text-gray-50 font-medium hover:underline"
                        >
                          Hindi -
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowVideo(true); // Show the video when a language link is clicked
                          }}
                          className="text-gray-50 font-medium hover:underline"
                        >
                          Tamil -
                        </a>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowVideo(true); // Show the video when a language link is clicked
                          }}
                          className="text-gray-50 font-medium hover:underline"
                        >
                          English
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <Modal
                  title="Attention"
                  open={isModalOpen}
                  footer={false}
                  closable={false}
                >
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
                            if (
                              e.key === "-" ||
                              e.key === "e" ||
                              e.key === "+" ||
                              e.key === "."
                            ) {
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
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={amountLoading}
                      >
                        Submit
                      </Button>
                    </div>
                  </Form>
                </Modal>
                {isTestMode && (
                  <Modal
                    title={
                      <div
                        className="absolute inset-x-0 top-0 text-center text-2xl text-black py-6"
                        style={{ width: "100%", zIndex: 1, backgroundColor:"cornflowerblue" }}
                      >
                        Welcome to Trust Pay
                      </div>
                    }
                    open={showTrustPayModal}
                    footer={
                      <div className="flex flex-col items-center gap-4 py-4">
                        <p className="text-zinc-600 text-lg text-center mb-6">
                          This is a test Payment. You can choose it to be a
                          success or failure.
                        </p>
                        <Button
                          key="Test Success"
                          type="primary"
                          onClick={() => handleTestResult("TEST_SUCCESS")}
                          className="bg-green-600 border-green-600 text-black w-80 h-12 text-lg"
                        >
                          Test Success
                        </Button>
                        <Button
                          key="Test Failure"
                          type="primary"
                          onClick={() => handleTestResult("TEST_DROPPED")}
                          className="bg-red-600 border-red-600 text-black w-80 h-12 text-lg"
                        >
                          Test Failure
                        </Button>
                      </div>
                    }
                    bodyStyle={{
                      color: "black",
                      borderRadius: "10px",
                      padding: "1.5rem",
                      boxShadow: "none",
                    }}
                    style={{
                      borderRadius: "10px",
                      width: "600px",
                      position: "relative",
                    }}
                    headerStyle={{
                      backgroundColor: "black",
                      color: "black",
                      borderBottom: "none",
                      boxShadow: "none",
                    }}
                  ></Modal>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Transactions;

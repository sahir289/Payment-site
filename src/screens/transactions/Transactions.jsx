import React, { useEffect, useState } from "react";
import { Spin, Tabs, Modal, Form, Input, Button, notification, Upload } from "antd";
import { UploadOutlined } from '@ant-design/icons';
import { FcRating } from "react-icons/fc";
import { Upi, Bank, Intent } from "../../components";
import { useParams } from "react-router-dom";
import { userAPI } from "../../services";
import ModelPopUp from "../../components/modelPopup/ModelPopUp";
import WebSockets from "../../components/webSockets/WebSockets";
import { ErrorImg } from "../../utils/constants";
import { useLocation } from "react-router-dom";
import "./transactions.css";
import pcicertificate from "../assets/pcicertificate.jpg";
import norton from "../assets/norton.jpg";
import { MdOutlineSupportAgent } from "react-icons/md";

const Transactions = () => {
  const params = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [amountLoading, setAmountLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [locatioVPNError, setLocatioVPNError] = useState(false);
  const [toggleTNCModal, setTNCModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState("0.0");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionsInformation, setTransactionInformation] = useState(null);
  const [paymentURL, setPaymentURL] = useState({});
  const [status, setStatus] = useState(null);
  const [paymentModel, setPaymentModel] = useState(false);
  const [modelData, setModelData] = useState({});
  const [redirected, setRedirected] = useState(false);
  const [isQr, setIsQr] = useState(false);
  const [isBank, setIsBank] = useState(false);
  const [allow_intent, setAllowIntent] = useState(false);
  const [allow_merchant_intent, setAllowMerchantIntent] = useState(false);
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
    // res.data.data.amount = 500;
    if (status.intent === true) {
      setPaymentModel(true);
      setModelData(status);
    }
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
      setLocatioVPNError(true);
      setStatus({
        status: res.error?.error?.status || "error",
        message: res.error.error,
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
    // data.amount = 500;
    if (Number(data?.amount) > 0) {
      handleAmount(data);
      return;
    }
    setIsModalOpen(true);
  };

  const handleUtrNumber = async (data) => {
    const updateData = {
      usrSubmittedUtr: data?.utrNumber?.trim(),
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
      setModelData({ ...res?.data?.data });
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
    } else {
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
      setIsQr(bankData.is_qr);
      setIsBank(bankData.is_bank);
      setAllowIntent(bankData.allow_intent);
      setAllowMerchantIntent(bankData.allow_merchant_intent);
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
              {locatioVPNError && (<div className="font-serif text-2xl bg-blue-400 p-6 font-semibold rounded-lg mt-2">
                <p>{status?.message}</p>
              </div>)}
              {!locatioVPNError && (<div className="font-serif text-2xl bg-blue-400 p-6 font-semibold rounded-lg mt-2">
                <p className="">Status : {status?.status}</p>
                <p>Message: {status?.message}</p>
              </div>)}
            </>
          ) : (
            <>
              <div className="main-section">
                {paymentModel === true && (
                  <ModelPopUp
                    paymentModel={paymentModel}
                    modelData={modelData}
                    redirected={redirected}
                    centered={true}
                    closable={false}
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
                    {(isQr && (!allow_intent || !allow_merchant_intent)) && (
                      <Tabs.TabPane tab="UPI" key="1">
                        <Upi {...transactionsInformation} amount={amount} />
                      </Tabs.TabPane>
                    )}
                    {(isBank && (!allow_intent || !allow_merchant_intent)) && (
                      <Tabs.TabPane tab="Bank Transfer" key="2">
                        <Bank {...transactionsInformation} amount={amount} />
                      </Tabs.TabPane>
                    )}
                    {(allow_intent && allow_merchant_intent) && (
                      <Tabs.TabPane tab="UPI Intent" key="3">
                        <Intent {...transactionsInformation} amount={amount} paymentURL={paymentURL} params={params} setStatus={setStatus} />
                      </Tabs.TabPane>
                    )}
                  </Tabs>
                  {(!allow_intent || !allow_merchant_intent) && (isQr || isBank) && <Tabs
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
                          ]}
                        >
                          <Input type="text" size="middle"
                            onKeyDown={(e) => {
                              if (e.key === " ") {
                                e.preventDefault(); // Prevent space key
                              }
                            }}
                            onChange={(e) => {
                              // Remove spaces if pasted or typed
                              e.target.value = e.target.value.replace(/\s+/g, "");
                            }}
                          />
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
                            className="ml-1 text-black"
                            size="middle"
                          >
                            Submit
                          </Button>
                        </Form.Item>
                      </Form>
                    </Tabs.TabPane>
                  </Tabs>}
                  {(allow_intent || allow_merchant_intent || isQr || isBank) && <>
                    <div className="certi-bg rounded-lg shadow-md mx-auto w-full font-serif">
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
                    <div className="bg-white rounded-lg shadow-md mx-auto w-full font-sans">
                      <div className="border-t border-gray-200 pt-2 text-center" style={{ backgroundColor: "cornflowerblue", borderRadius: "10px" }}>
                        <h2 className="text-black font-semibold mb-2">
                          {!showVideo && (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setShowVideo(true); // Show the video when clicked
                              }}
                              className="text-black font-medium hover:underline"
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
                        <div className="space-y-2 mt-2">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowVideo(true); // Show the video when a language link is clicked
                            }}
                            className="text-black font-medium hover:underline"
                          >
                            Telugu -
                          </a>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowVideo(true); // Show the video when a language link is clicked
                            }}
                            className="text-black font-medium hover:underline"
                          >
                            Hindi -
                          </a>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowVideo(true); // Show the video when a language link is clicked
                            }}
                            className="text-black font-medium hover:underline"
                          >
                            Tamil -
                          </a>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowVideo(true); // Show the video when a language link is clicked
                            }}
                            className="text-black font-medium hover:underline"
                          >
                            English
                          </a>
                          <div className="flex justify-between">
                            <div className="flex ml-2 mb-4">
                              <button onClick={() => setTNCModal(true)}>
                                Terms & Conditions <span className="text-red-500">*</span>
                              </button>
                            </div>
                            <div className="flex">
                              <MdOutlineSupportAgent size={24} />
                              <a
                                href="https://t.me/TRUSTPAY_1"
                                className="text-black text-xl font-medium hover:underline ml-2 mr-2 mb-4"
                              >
                                Contact Support
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>}
                </div>

                <Modal
                  title={<div style={{ textAlign: 'center' }}>Amount</div>}
                  open={isModalOpen}
                  footer={false}
                  className="custom-modal"
                  closable={false}
                  centered={true}
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
                          addonBefore="₹"
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
                        className="text-black"
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
                        style={{ width: "100%", zIndex: 1, backgroundColor: "cornflowerblue" }}
                      >
                        Welcome to Trust Pay
                      </div>
                    }
                    className="custom-modal"
                    open={showTrustPayModal}
                    closable={false}
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
                      backgroundColor: "rgb(250, 250, 242)",
                      borderRadius: "10px",
                      padding: "1.5rem",
                      boxShadow: "none",
                    }}
                    style={{
                      borderRadius: "10px",
                      width: "600px",
                      position: "relative",
                      // backgroundColor: "rgb(250, 250, 242)",
                    }}
                    headerStyle={{
                      backgroundColor: "rgb(250, 250, 242)",
                      // borderRadius: "10px",
                      color: "black",
                      borderBottom: "none",
                      boxShadow: "none",
                    }}
                    footerStyle={{
                      backgroundColor: "rgb(250, 250, 242)",
                    }}
                  >
                  </Modal>
                )}
                <Modal
                  title=""
                  open={toggleTNCModal}
                  footer={null}
                  className="custom-modal"
                  closable={true}
                  centered
                  width={600} // Ensure consistent width
                  style={{ maxHeight: '80vh', overflowY: 'auto' }} // Handle long content in a scrollable manner
                  onCancel={() => setTNCModal(false)}
                >
                  <div style={{ marginBottom: 16 }}>
                    <h4><b>Terms and Conditions</b><span className="text-red-500">*</span></h4>
                  </div>

                  <div>
                    <h5>1. Introduction and Definitions</h5>
                    <p>Overview of the agreement and important definitions (e.g., "Merchant," "Service," "Transaction").</p>

                    <h5>2. Services Provided</h5>
                    <p>Description of the payment gateway services (e.g., processing payments, fraud detection, etc.).</p>

                    <h5>3. Fees and Charges</h5>
                    <p>Details of fees associated with the use of the payment gateway (e.g., transaction fees, monthly fees, chargeback fees).</p>

                    <h5>4. Merchant Account Requirements</h5>
                    <ul>
                      <li>Eligibility criteria for merchants, such as business type, location, and financial standing.</li>
                      <li>Agreement to provide necessary documentation to verify business identity.</li>
                    </ul>

                    <h5>5. Payment Processing</h5>
                    <ul>
                      <li>How payments are processed, including supported payment methods (credit cards, digital wallets, etc.).</li>
                      <li>Processing timelines (e.g., settlement period for funds transfer to the merchant's bank account).</li>
                    </ul>

                    <h5>6. Chargebacks and Disputes</h5>
                    <ul>
                      <li>Explanation of chargeback procedures, responsibilities of the merchant and consumer in case of disputes.</li>
                      <li>Merchant's obligation to handle customer complaints and issues.</li>
                    </ul>

                    <h5>7. Security and Fraud Prevention</h5>
                    <ul>
                      <li>Requirements for data security, including encryption and compliance with security standards (e.g., PCI DSS).</li>
                      <li>How fraud prevention tools are implemented and the merchant's role in preventing fraudulent transactions.</li>
                    </ul>

                    <h5>8. Privacy and Data Protection</h5>
                    <ul>
                      <li>How personal and financial data is handled, stored, and protected in compliance with privacy laws (e.g., GDPR, CCPA).</li>
                      <li>The merchant's responsibility for handling customer data appropriately.</li>
                    </ul>

                    <h5>9. Termination of Agreement</h5>
                    <ul>
                      <li>Conditions under which either party can terminate the agreement (e.g., breach of terms, non-payment, fraud detection).</li>
                      <li>The process of deactivating accounts and processing pending transactions after termination.</li>
                    </ul>

                    <h5>10. Limitation of Liability</h5>
                    <ul>
                      <li>Limits on the liability of the payment gateway provider in case of system failures, fraud, or other issues.</li>
                      <li>Merchant’s responsibility for maintaining proper records and managing customer relationships.</li>
                    </ul>

                    <h5>11. Compliance with Laws</h5>
                    <p>Requirement for both the merchant and payment gateway to comply with relevant laws and regulations (e.g., anti-money laundering, data protection laws).</p>

                    <h5>12. Amendments and Modifications</h5>
                    <p>The ability of the payment gateway provider to change terms and conditions, with prior notice given to merchants.</p>

                    <h5>13. Indemnity</h5>
                    <p>The merchant's obligation to indemnify the payment gateway provider for any losses incurred due to the merchant's actions, such as fraud or violation of terms.</p>

                    <h5>14. Dispute Resolution and Governing Law</h5>
                    <ul>
                      <li>Details on how disputes will be handled (e.g., mediation, arbitration).</li>
                      <li>Which jurisdiction's laws apply to the agreement.</li>
                    </ul>
                  </div>
                </Modal>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Transactions;

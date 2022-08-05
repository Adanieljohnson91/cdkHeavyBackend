import React, { useEffect, useState } from "react";
import { IInput, PageStatus, InputStatus, PAGE_MESSAGES } from "../interfaces/CIFInterfaces";
import { ethers } from "ethers";
import {pollForRequest, sendHexForCalculation} from "../services/calculationService";


export default function CalculationInputForm() {
  const [input, setInput] = useState<IInput>({
    hex: "",
  });

  const [pageStatus, setPageStatus] = useState<PageStatus>({
    status: InputStatus.UNKNOWN,
    message: PAGE_MESSAGES[InputStatus.UNKNOWN],
  });

  const onChangeHandler = (e: React.FormEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    setInput({ hex: newValue });
  };

  const onClickHandler = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    // Check for input validity
    if (pageStatus.status === InputStatus.VALID) {
      console.log("Sending Request");
      const res = await sendHexForCalculation({ hex: input.hex });
      console.log(res.message[0]);
      setPageStatus({
        status: InputStatus.PENDING,
        message: PAGE_MESSAGES[InputStatus.PENDING]
      })
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(res);
      await pollForRequest({hex: input.hex}, setPageStatus);
    } else {
      console.log("cannot sent request");
    }
  };

  const checkInput = () => {
    if (input.hex.length < 2 && ethers.utils.isHexString("0x" + input.hex)) {
      setPageStatus({
        status: InputStatus.UNKNOWN,
        message: PAGE_MESSAGES[InputStatus.UNKNOWN],
      });
    } else if (ethers.utils.isHexString("0x" + input.hex)) {
      setPageStatus({ 
        status: InputStatus.VALID,
        message: PAGE_MESSAGES[InputStatus.VALID],
      });
    } else {
      setPageStatus({
        status: InputStatus.INVALID,
        message: PAGE_MESSAGES[InputStatus.INVALID],
      });
    }
  };


  useEffect(() => {
    checkInput();
  }, [input.hex]);

  return (
    <>
      <form>
        <div className="flex-none items-center text-center">
          <label className="text-white font-mono">FIND FIRST LOWER HEX</label>
        </div>
        <div className="text-center items-center">
          <input type="text" value={input.hex} onChange={onChangeHandler} />
        </div>

      
        <div className="flex-none items-center text-center ">
          <button
            className="m-1 bg-blue-400 hover:bg-blue-500 font-mono text-white font-bold py-2 px-4 rounded"
            type="button"
            onClick={onClickHandler}
          >
            GET RESULT
          </button>
        </div>
          
      </form>
      <div className="flex items-center h-4 font-mono">
          <small
            className={`${
              pageStatus.status === InputStatus.INVALID
                ? "text-red-600"
                : "text-white"
            }`}
          >
            {pageStatus.message}
          </small>
        </div>
    </>
  );
}

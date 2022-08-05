import React from "react";
import { ICalculationRequest, PageStatus, InputStatus, PAGE_MESSAGES } from "../interfaces/CIFInterfaces";

/**
 * Send Request for calculation work. sendHexForCalculation returns Promise
 * with message object
 * @param calculationRequest ICalculationRequest object with 256-bit Hexadecimal String {"hex": <hexString>}
 * @returns Promise
 */
export async function sendHexForCalculation(calculationRequest: ICalculationRequest) {
    return await fetch("http://localhost:8080/calcRequest", {
        method: "POST",
        body: JSON.stringify(calculationRequest),
        headers: {
            "Content-Type": "application/json"
        },
        mode: "cors"
    }).then(res => {
        return res.json();
    })
        .then(json => {
            console.log(json.hex)
            return json
        })
        .catch((err) => console.log(`Error: ${err}`));
}

/**
 * pollForRequest is a Long Poll method to check and retrieve the status of a given request after the
 * request has been made. 
 * @param calculationRequest ICalculationRequest object with 256-bit Hexadecimal String {"hex": <hexString>}
 * @param setMessage  Hook to set state of application
 * @returns 
 */
export async function pollForRequest(calculationRequest: ICalculationRequest, setMessage: React.Dispatch<React.SetStateAction<PageStatus>>) {
    console.log("Getting Request");
    return await fetch(`http://localhost:8080/calcRequest/${calculationRequest.hex}`, {
        method: "GET",
        mode: "cors"
    }).then(async (response) => {
        if (response.status == 502) {
            setMessage({
                status: InputStatus.PENDING,
                message: PAGE_MESSAGES[InputStatus.PENDING]
            })
            await pollForRequest(calculationRequest, setMessage);
        } else if (response.status != 200) {
            setMessage({
                status: InputStatus.PENDING,
                message: PAGE_MESSAGES[InputStatus.PENDING]
            })
            await new Promise(resolve => setTimeout(resolve, 1000));
            await pollForRequest(calculationRequest, setMessage);
        } else {
            const result = await response.json()
            const { Nonce, Hex, JobStatus, ResultHash } = result.message;
            console.log("MEssage",)
            setMessage({
                status: "", message: `JobStatus:${JobStatus}
        OriginalHex:${Hex}
        Result:${ResultHash}
        Nonce:${Nonce}`
            });
            return;
        }
    })
}

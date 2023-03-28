import * as functions from "firebase-functions";
import {parse} from "node-html-parser";
import * as playground from "./htmlToParse"

type Question = {
    id : Number
    legend : String
    options : String[]
    goodAnswers : String[]
    badAnswers : String[]
    status : String
}

const idSelector = `div.qm_QUESTION`
const legendSelector = `div.qm_QUESTION > div.qm_QUESTION_FEEDBACK > fieldset > legend > span.qm_HTML_CONTENT`
const optionsSelector = `div.qm_QUESTION > div.qm_QUESTION_FEEDBACK > fieldset > div.qm_QUESTION_mc > table > tbody > tr`
const optionImgSelector = `td.qm_CHOICE_mc > img.qm_Graphic_Inputs`
const optionLabelSelector = `td.qm_CHOICE_mc > span.qm_HTML_CONTENT`
const answeredSelector = `div.qm_QUESTION > div.qm_QUESTION_FEEDBACK > fieldset > div.qm_ANSWERED`
const answeredRegex = /^\s*(\d+)\s*out of\s*(\d+)\s*$/;


function getQuestionDetails(htmlQuestion: string) : Question {

    const parsedQuestion = parse(htmlQuestion)
    let id : Number
    let legend : String
    let answered : String
    let goodAnswers : String[] = []
    let badAnswers : String[] = []
    let status : String


    const idQuery = parsedQuestion.querySelector(idSelector)
    if(idQuery !== null) {

        const idAttribute = idQuery.getAttribute(`id`)
        if(idAttribute !== undefined){
            id = parseInt(idAttribute, 10)
        }
        else { throw Error("Question.id is undefined") }
    } else { throw Error("Question.id is null") }

    const legendQuery = parsedQuestion.querySelector(legendSelector)
    if(legendQuery !== null) {
       legend = legendQuery.text
    } else {
        throw Error("Question.legend is null")
    }

    let options: string[] = []
    let checkedAnswer: Number[] = []

    parsedQuestion.querySelectorAll(optionsSelector).forEach((value, index) => {
        const imgSelectorQuery = value.querySelector(optionImgSelector)
        if(imgSelectorQuery !== null) {
            const imgSrcQuery = imgSelectorQuery.getAttribute(`src`)
            if(imgSrcQuery !== undefined) {
                if(imgSrcQuery.includes(`radio-checked-nb.png`)) {
                    checkedAnswer.push(index)
                }
            } else {
                throw Error("imgSrcQuery is undefined")
            }
        } else {
            throw Error("imgSelectorQuery is null")
        }

        const optionLabelQuery = value.querySelector(optionLabelSelector)
        if(optionLabelQuery !== null) {
            options.push(optionLabelQuery.text)
        } else {
            throw Error("optionLabelQuery is null")
        }
    })

    const answeredQuery = parsedQuestion.querySelector(answeredSelector)
    if (answeredQuery !== null) {
        answered = answeredQuery.text
        const match = answered.match(answeredRegex)
        if(match) {
            let firstValue = parseInt(match[1], 10)
            let secondValue = parseInt(match[2], 10)
    
            if (firstValue >= secondValue) {
                status = "OK"
                options.forEach((value, index) => {
                    if(checkedAnswer.includes(index) ) {
                        goodAnswers.push(options[index])
                    }
                    else {
                        badAnswers.push(options[index])
                    }
                })
            } else {
                status = "KO"
                options.forEach((value, index) => {
                    if(checkedAnswer.includes(index)) {
                        badAnswers.push(options[index])
                    }
                })
            }
        } else {
            status = "UNKOWN"
        }
    } else {
        throw Error("answeredQuery is null")
    }

    let question : Question = {
        id : id, 
        legend : legend, 
        options : options,
        goodAnswers : goodAnswers,
        badAnswers : badAnswers,
        status : status    
    }

    return question
}

export const jsonParser = functions.https.onRequest((request, response) => {

    const parsedQuestion = parse(playground.test)
    parsedQuestion.querySelectorAll(idSelector).forEach((value, index) => {
        const question = getQuestionDetails(value.outerHTML)
        console.log(question)
    })


    response.status(200).send("maman")
});





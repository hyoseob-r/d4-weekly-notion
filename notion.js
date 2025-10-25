import axios from 'axios';

export function notionClient(token){
  return axios.create({
    baseURL: 'https://api.notion.com/v1/',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });
}

export function H1(t){return {object:'block',type:'heading_1',heading_1:{rich_text:[{type:'text',text:{content:t}}]}}}
export function H2(t){return {object:'block',type:'heading_2',heading_2:{rich_text:[{type:'text',text:{content:t}}]}}}
export function H3(t){return {object:'block',type:'heading_3',heading_3:{rich_text:[{type:'text',text:{content:t}}]}}}
export function P(t){return {object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:t}}]}}}
export function Bulleted(t){return {object:'block',type:'bulleted_list_item',bulleted_list_item:{rich_text:[{type:'text',text:{content:t}}]}}}
export function Link(label, url){
  return {object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content:`• ${label}`, link:{url}}}]}};
}

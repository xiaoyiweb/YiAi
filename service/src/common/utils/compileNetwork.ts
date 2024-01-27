import axios from 'axios';

function formatSearchData(searchData, question) {
  const formatStr = searchData.map(({ title, body, href }) => `'${title}' : ${body} ;`).join('\n\n');
  // const formatStr = searchData.map(({ title, body, href }) => `'${title}' : ${body} ; (${href})`).join('\n\n');
  const instructions =
    'Instructions: Reply to me in the language of my request or question above. Give a comprehensive answer to the question or request I have made above. Below are some results from a web search. Use the following results to summarize the answers \n\n';
  return `${question}\n\n${instructions}\n${formatStr}`;
}

export async function compileNetwork(question: string, limit = 7) {
  let searchData = [];
  try {
    const responseData = await axios.get(`https://s0.awsl.app/search?q=${question}&max_results=${limit}`);
    searchData = responseData.data;
  } catch (error) {
    console.log('error: ', error);
    searchData = [];
  }
  if (searchData.length === 0) {
    return question;
  } else {
    return formatSearchData(searchData, question);
  }
}

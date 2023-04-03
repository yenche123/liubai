import { searchInner } from "./search-inner"
import { searchRecent, addKeywordToRecent, deleteKeyword } from "./search-recent"
import { searchSuggest } from "./search-suggest"
import { searchThird } from "./search-third"

export default {
  searchSuggest,
  searchRecent,
  addKeywordToRecent,
  deleteKeyword,
  searchInner,
  searchThird,
}
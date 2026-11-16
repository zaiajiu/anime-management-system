import { useEffect, useState } from 'react';
import { fetchAnimeList } from '@/api/anime'
export default function LoginPage() {
  var listState = useState([]);
  var list = listState[0];
  var setList = listState[1];

  useEffect(function(){
    fetchAnimeList(1,'id','DESC')
    .then(function(res){
        if(res.success){
            setList.apply(res.data);
        }
    });
  },[])
  console.log("当前动漫列表数据：", list);
  return (
    <div>
      <h1>My Anime</h1>
    </div>
  );
}
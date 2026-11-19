import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '@/api/user';
import { setToken } from '@/utils/auth'; 
export default function LoginPage() {
    var navigate = useNavigate();
    var [username,setUsername] = useState('');
    var [password,setPassword] = useState('');
    function handleLogin(e){
        e.preventDefault();
        if(username.trim() ==='' || password.trim() ===''){
            alert("请输入账号密码！")
            return;
        }
        loginApi(username, password).then(function (res) {
      if (res.success) {
        alert('登录成功！');

        navigate('/'); 
      } else {
        alert('登录失败：' + res.message);
      }
    }).catch(function(error){
        alert("4xx")
    });
    };
    
  return (
    <div style = {{ padding: '50px'}}>
      <h2>登录</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '200px', gap: '10px' }}>
        <input 
        placeholder='请输入账号' 
        value={username}
        onChange={(e)=> setUsername(e.target.value)}/>
        <input 
        type='password'
        placeholder='请输入密码' 
        value={password}
        onChange={(e)=> setPassword(e.target.value)}/>
        <button type="submit">登录</button>

      </form>
    </div>
  );
}
/***
  사용 규칙
  메시지에 담아 보내는 처리는 마지막 res.send()에 담아보내는 것으로 한다.
  async 처리를 통한 callback 처리 시 msg에 담아 보낼 경우 문제가 발생하는 경우가 발생하기 때문이다.
  series 처리 시에는 데이터가 마지막에 배열로 콜백 되기에 msg에 담아 보낼 수 없고
  waterfall의 경우 다음 함수에 인자를 전달하는 경우로 사용되기에 msg에 담아 보내봤자 다시 열어야 한다.
  따라서 헷갈리지 않게 callback에 담는 데이터는 raw 데이터로 정보 그대로를 담아보내고 최종 마지막 result처리시에
  res.send에 담아 보낼때 msg를 이용하여 형식화 하여 보내는 것으로 통일하는 것이 좋다.
  단, 에러 처리는 그때그때에 해당하는 에러 정보를 담기위해(ex. 출력된 데이터가 없는 경우) 발생하는 즉시 msg에 담아 보낸다.
***/

function msg(arg1, arg2, arg3) {
    return {
        err: {
            code: arg1,
            msg: arg2
        },
        data: arg3
    }
}

module.exports = msg;

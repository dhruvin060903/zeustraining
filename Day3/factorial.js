let arr = [1];
const base = 10000000;

function multiplication(n) {
  let carry = 0;

  for (let i = 0; i < arr.length; i++) {
    let num = arr[i] * n + carry;
    arr[i] = num % base;
    carry = Math.trunc(num / base);
  }

  while (carry > 0) {
    arr.push(carry % base);
    carry = Math.trunc(carry / base);
  }
}

function factorial(num) {
  arr = [1];
  for (let i = 2; i <= num; i++) {
    multiplication(i);
  }

  let ans = arr[arr.length - 1].toString();
  for (let i = arr.length - 2; i >= 0; i--) {
    ans += arr[i].toString().padStart(7, '0');
  }
  console.log(arr);

  console.log(ans);
  console.log(`Total digits: ${arr.length}`);
}

factorial(1000);

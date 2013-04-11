function B = oversample(A,mfactor,dim)
% smooth by linear interpolation

dim = eval('dim','2');
if dim<1 | dim>2, 
  error(['dim must be 1 or 2, not ' num2str(dim)]);
end
[m,n] = size(A);
if dim==1,
  B = zeros(mfactor*(m+1)+1,n);
  B(mfactor+1:mfactor:end-1,:) = A;
elseif dim==2,
  B = zeros(m,mfactor*(n+1)+1);
  B(:,mfactor+1:mfactor:end-1) = A;
end
b = [1:mfactor mfactor-1:-1:1]/mfactor;
B = filter(b,1,B,[],dim);
if dim==1,
  B = B(mfactor:end,:);
elseif dim==2,
  B = B(:,mfactor:end);
end
